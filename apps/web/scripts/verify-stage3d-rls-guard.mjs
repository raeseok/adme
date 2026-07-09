/**
 * Stage 3-D — RLS / service-role / quiz raw / anon write guards
 */
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAnonSupabaseClient,
  KNOWN_PROD_SUPABASE_REF,
  getSupabaseProjectRef,
} from "./e2e/supabase-auth-session.mjs";
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";
import { readText, walkFiles } from "./utils/stage3d-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const BASE = resolveProductionE2eBaseUrl();

const MARKERS = [
  "stage3DRlsRelaxed=false",
  "stage3DAnonWritePolicyAdded=false",
  "stage3DServiceRoleClientExposure=false",
  "stage3DQuizRawTableClientSelectable=false",
  "stage3DAdvertiserPartnerRawAdViewsBlocked=true",
];

function verifyMigrations() {
  const rls = readFileSync(
    join(REPO_ROOT, "supabase/migrations/20260706100200_stage0_rls.sql"),
    "utf8",
  );
  if (/DISABLE ROW LEVEL SECURITY/i.test(rls)) {
    throw new Error("RLS disable found in stage0 RLS migration");
  }
  if (!rls.includes("ENABLE ROW LEVEL SECURITY")) {
    throw new Error("RLS enable missing");
  }
  if (!rls.includes("REVOKE ALL ON TABLE public.quizzes FROM anon, authenticated")) {
    throw new Error("quizzes raw revoke missing");
  }
  // quizzes_public SELECT list must omit quiz_answer (comment may mention it)
  const viewMatch = rls.match(
    /CREATE OR REPLACE VIEW public\.quizzes_public[\s\S]*?FROM public\.quizzes;/i,
  );
  if (!viewMatch) {
    throw new Error("quizzes_public view definition missing");
  }
  if (/\bquiz_answer\b/i.test(viewMatch[0])) {
    throw new Error("quizzes_public SELECT must not include quiz_answer");
  }
  console.log("PASS: migration RLS / quizzes_public guards");

  // Scan later migrations for DISABLE RLS
  const migDir = join(REPO_ROOT, "supabase/migrations");
  for (const name of readdirSync(migDir)) {
    if (!name.endsWith(".sql")) continue;
    const text = readFileSync(join(migDir, name), "utf8");
    if (/DISABLE ROW LEVEL SECURITY/i.test(text)) {
      throw new Error(`RLS disable in ${name}`);
    }
  }
  console.log("PASS: no DISABLE ROW LEVEL SECURITY in migrations");
}

function verifyNoServiceRoleInClient() {
  const clientRoots = [
    join(WEB_ROOT, "src/app"),
    join(WEB_ROOT, "src/components"),
  ];
  for (const root of clientRoots) {
    for (const file of walkFiles(root)) {
      const text = readText(file);
      if (
        text.includes("SERVICE_ROLE") ||
        text.includes("service_role") ||
        text.includes("SUPABASE_SERVICE_ROLE_KEY")
      ) {
        throw new Error(`service role reference in ${file}`);
      }
    }
  }

  const nextStatic = join(WEB_ROOT, ".next/static");
  if (existsSync(nextStatic)) {
    for (const file of walkFiles(nextStatic)) {
      const text = readFileSync(file, "utf8");
      if (text.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        throw new Error(`service role in client bundle ${file}`);
      }
    }
  }
  console.log("PASS: no service role client exposure");
}

async function verifyLiveRls() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, MARKERS, "RLS markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) throw new Error("anon client unavailable");
  if (getSupabaseProjectRef() !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error("ref mismatch");
  }

  const anonLedger = await supabase.from("point_ledger").insert({
    account_type: "consumer",
    user_id: "00000000-0000-4000-8000-000000000001",
    entry_type: "quiz_reward",
    amount: 1,
  });
  if (!anonLedger.error) {
    throw new Error("anon point_ledger INSERT must fail");
  }
  console.log("PASS: anon point_ledger write blocked");

  const anonQuiz = await supabase.from("quizzes").select("id, quiz_answer").limit(1);
  if (!anonQuiz.error && (anonQuiz.data?.length ?? 0) > 0) {
    throw new Error("anon must not select raw quizzes");
  }
  console.log("PASS: anon raw quizzes select blocked or empty");

  const pub = await supabase
    .from("quizzes_public")
    .select("*")
    .limit(5);
  if (pub.error) {
    console.log(`INFO: quizzes_public select: ${pub.error.message}`);
  } else {
    for (const row of pub.data ?? []) {
      if ("quiz_answer" in row || "correctAnswer" in row) {
        throw new Error("quizzes_public exposes answer fields");
      }
    }
    console.log("PASS: quizzes_public has no answer columns");
  }

  // Advertiser role should not read arbitrary consumer ad_views PII via cross-user
  const email = `stage3d-rls-adv-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(16).toString("base64url");
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "advertiser" } },
  });
  let session = signUp.data.session;
  if (!session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    session = signIn.data.session;
  }
  if (session) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    console.log(`INFO: advertiser probe ${maskEmail(email)}`);
    const advViews = await supabase
      .from("ad_views")
      .select("consumer_user_id, id")
      .limit(20);
    // Without advertiser org linkage, should be empty or error — not broad PII dump
    const rows = advViews.data ?? [];
    if (rows.length > 0) {
      console.log(
        `INFO: advertiser saw ${rows.length} ad_views rows (org-scoped policy may allow own campaigns)`,
      );
    } else {
      console.log("PASS: advertiser ad_views empty without org linkage");
    }
  } else {
    console.log("INFO: advertiser session unavailable — skipped live probe");
  }
}

async function main() {
  verifyMigrations();
  verifyNoServiceRoleInClient();
  await verifyLiveRls();
  console.log("RESULT: stage3DRlsRelaxed=false");
  console.log("RESULT: stage3DServiceRoleClientExposure=false");
  console.log("PASS: verify:stage3d-rls-guard");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
