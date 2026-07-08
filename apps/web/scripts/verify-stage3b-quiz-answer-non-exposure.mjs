/**
 * Stage 3-B — quiz_answer must not appear in RPC, HTML, diagnostics, or network payloads
 */
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  KNOWN_DEV_SUPABASE_REF,
} from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BASE = resolveProductionE2eBaseUrl();
const RPC = "rpc_stage3b_dev_submit_quiz_reward_transaction";
const DEV_REF = KNOWN_DEV_SUPABASE_REF;

const E2E_CAMPAIGN_ID = "e2e00002-0000-4000-8000-000000000002";
const E2E_QUIZ_ID = "e2e00003-0000-4000-8000-000000000003";
const FIXTURE_CORRECT_LABEL = Buffer.from("7IiY7JqU7J28", "base64").toString("utf8");

const FORBIDDEN = [
  "quiz_answer",
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
];

function loadDevAnonEnv() {
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${DEV_REF} -o json`,
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find(
    (k) => k.id === "anon" && typeof k.api_key === "string" && k.api_key.startsWith("eyJ"),
  );
  if (!anon?.api_key) {
    throw new Error("dev anon key not found");
  }
  return { url: `https://${DEV_REF}.supabase.co`, key: anon.api_key };
}

function assertNoForbidden(text, label) {
  for (const term of FORBIDDEN) {
    if (text.includes(term)) {
      throw new Error(`${label} exposes forbidden term: ${term}`);
    }
  }
}

function assertNoForbiddenFields(text, label) {
  assertNoForbidden(text, label);
}

async function verifyRpcNonExposure() {
  const env = loadDevAnonEnv();
  const supabase = createClient(env.url, env.key);
  const email = `stage3b-exp-${Date.now()}@example.com`;
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
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  console.log(`INFO: dev consumer ${maskEmail(email)}`);

  const { data: adView, error: avErr } = await supabase
    .from("ad_views")
    .insert({
      consumer_user_id: session.user.id,
      campaign_id: E2E_CAMPAIGN_ID,
      quiz_id: E2E_QUIZ_ID,
      status: "viewed",
      view_started_at: new Date(Date.now() - 10000).toISOString(),
      viewed_seconds: 10,
    })
    .select("id")
    .single();
  if (avErr) {
    throw new Error(`ad_view fixture failed: ${avErr.message}`);
  }

  const key = `stage3b:quiz_reward:${session.user.id}:${adView.id}:${E2E_CAMPAIGN_ID}:${E2E_QUIZ_ID}`;
  const rpc = await supabase.rpc(RPC, {
    p_ad_view_id: adView.id,
    p_campaign_id: E2E_CAMPAIGN_ID,
    p_quiz_id: E2E_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key,
  });
  if (rpc.error && !rpc.error.message.includes("STAGE3B")) {
    throw new Error(`RPC failed: ${rpc.error.message}`);
  }
  const payload = JSON.stringify(rpc.data ?? { error: rpc.error?.message });
  assertNoForbidden(payload, "RPC response");
  console.log("PASS: RPC response quiz_answer exposure=false");

  const { data: quizPublic } = await supabase
    .from("quizzes_public")
    .select("*")
    .eq("id", E2E_QUIZ_ID)
    .maybeSingle();
  if (quizPublic && "quiz_answer" in quizPublic) {
    throw new Error("quizzes_public must not include quiz_answer column");
  }
  console.log("PASS: quizzes_public only contract maintained");

  const directQuiz = await supabase.from("quizzes").select("quiz_answer").eq("id", E2E_QUIZ_ID);
  if (!directQuiz.error && (directQuiz.data?.length ?? 0) > 0) {
    throw new Error("client must not read quizzes.quiz_answer");
  }
  console.log("PASS: quizzes base table direct SELECT blocked for client");

  console.log(
    `INFO: fixture answer hash=${createHash("sha256").update(FIXTURE_CORRECT_LABEL).digest("hex").slice(0, 12)}`,
  );
}

async function verifyHtmlAndDiagnostics() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const captured = [];

    page.on("response", async (res) => {
      try {
        const ct = res.headers()["content-type"] ?? "";
        if (ct.includes("json") || ct.includes("text")) {
          const body = await res.text();
          captured.push(body);
        }
      } catch {
        /* ignore */
      }
    });

    for (const route of ["/", "/consumer", "/consumer/ads", "/auth/login"]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      assertNoForbiddenFields(html, `HTML ${route}`);
      assertNoForbiddenFields(body, `body ${route}`);
      console.log(`PASS: public route ${route} quiz_answer exposure=false`);
    }

    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const diag = await page.locator("body").innerText();
    assertNoForbidden(diag, "diagnostics");
    if (!diag.includes("stage3BQuizAnswerExposure=false")) {
      throw new Error("diagnostics missing stage3BQuizAnswerExposure=false");
    }
    console.log("PASS: diagnostics quiz_answer exposure=false");

    for (const payload of captured) {
      assertNoForbidden(payload, "network payload");
    }
    console.log("PASS: network payload quiz_answer exposure=false");
  } finally {
    await browser.close();
  }
}

async function main() {
  await verifyRpcNonExposure();
  await verifyHtmlAndDiagnostics();
  console.log("PASS: verify:stage3b-quiz-answer-non-exposure");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
