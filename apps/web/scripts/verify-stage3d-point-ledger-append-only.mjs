/**
 * Stage 3-D — point_ledger append-only static + Production mutation probe
 */
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
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
  "stage3DPointLedgerAppendOnly=true",
  "stage3DPointLedgerDirectInsertPolicy=false",
  "stage3DPointLedgerUpdateDeleteAllowed=false",
  "stage3DProductionPointLedgerMutation=false",
];

const DIRECT_INSERT =
  /\.from\(\s*["']point_ledger["']\s*\)\s*\.(insert|update|delete|upsert)/;

function verifyStaticNoClientDirectMutation() {
  const scanRoots = [
    join(WEB_ROOT, "src/app"),
    join(WEB_ROOT, "src/components"),
    join(WEB_ROOT, "src/lib"),
  ];
  const allowed = new Set([
    // verify scripts are outside src; allow docs comments in stage modules
  ]);
  for (const root of scanRoots) {
    for (const file of walkFiles(root)) {
      if (allowed.has(file)) continue;
      const text = readText(file);
      if (DIRECT_INSERT.test(text)) {
        throw new Error(`direct point_ledger mutation path: ${file}`);
      }
    }
  }
  console.log("PASS: no client/server direct point_ledger mutation paths");

  const rls = readFileSync(
    join(REPO_ROOT, "supabase/migrations/20260706100200_stage0_rls.sql"),
    "utf8",
  );
  if (/CREATE POLICY\s+\w+\s+ON\s+public\.point_ledger\s+FOR\s+INSERT/i.test(rls)) {
    throw new Error("point_ledger INSERT policy must not exist");
  }
  if (/CREATE POLICY\s+\w+\s+ON\s+public\.point_ledger\s+FOR\s+UPDATE/i.test(rls)) {
    throw new Error("point_ledger UPDATE policy must not exist");
  }
  if (/CREATE POLICY\s+\w+\s+ON\s+public\.point_ledger\s+FOR\s+DELETE/i.test(rls)) {
    throw new Error("point_ledger DELETE policy must not exist");
  }
  if (!rls.includes("INSERT/UPDATE/DELETE: authenticated 직접 금지")) {
    throw new Error("append-only comment missing in RLS migration");
  }
  console.log("PASS: RLS migration — no point_ledger write policies");
}

async function verifyProductionBlocked() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, MARKERS, "point_ledger markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) throw new Error("anon client unavailable");
  if (getSupabaseProjectRef() !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error("ref mismatch");
  }

  const email = `stage3d-ledger-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(16).toString("base64url");
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "consumer" } },
  });
  let session = signUp.data.session;
  if (!session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    session = signIn.data.session;
  }
  if (!session) throw new Error("sign-in failed");
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  console.log(`INFO: consumer ${maskEmail(email)}`);

  const before = await supabase
    .from("point_ledger")
    .select("*", { count: "exact", head: true });

  const insert = await supabase.from("point_ledger").insert({
    account_type: "consumer",
    user_id: session.user.id,
    entry_type: "quiz_reward",
    amount: 1,
    description: "stage3d-should-fail",
  });
  if (!insert.error) {
    throw new Error("authenticated direct INSERT must fail");
  }
  console.log("PASS: authenticated direct INSERT blocked");

  const update = await supabase
    .from("point_ledger")
    .update({ amount: 0 })
    .eq("user_id", session.user.id);
  if (!update.error && (update.count ?? 0) > 0) {
    throw new Error("authenticated UPDATE must not affect rows");
  }
  console.log("PASS: authenticated UPDATE blocked or no-op");

  const del = await supabase
    .from("point_ledger")
    .delete()
    .eq("user_id", session.user.id);
  if (!del.error && (del.count ?? 0) > 0) {
    throw new Error("authenticated DELETE must not affect rows");
  }
  console.log("PASS: authenticated DELETE blocked or no-op");

  const rpc = await supabase.rpc(
    "rpc_stage3b_dev_submit_quiz_reward_transaction",
    {
      p_ad_view_id: randomUUID(),
      p_campaign_id: "e2e00002-0000-4000-8000-000000000002",
      p_quiz_id: "e2e00003-0000-4000-8000-000000000003",
      p_selected_option: "수요일",
      p_idempotency_key: `stage3b:quiz_reward:${session.user.id}:${randomUUID()}:e2e00002-0000-4000-8000-000000000002:e2e00003-0000-4000-8000-000000000003`,
    },
  );
  if (!rpc.error?.message?.includes("STAGE3B_PRODUCTION_BLOCKED")) {
    throw new Error(
      `expected STAGE3B_PRODUCTION_BLOCKED, got ${rpc.error?.message ?? "ok"}`,
    );
  }
  console.log("PASS: Production RPC still STAGE3B_PRODUCTION_BLOCKED");

  const after = await supabase
    .from("point_ledger")
    .select("*", { count: "exact", head: true });
  if ((after.count ?? 0) !== (before.count ?? 0)) {
    throw new Error("Production point_ledger count changed");
  }
  console.log("PASS: Production point_ledger mutation=false");
}

async function main() {
  verifyStaticNoClientDirectMutation();
  await verifyProductionBlocked();
  console.log("PASS: verify:stage3d-point-ledger-append-only");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
