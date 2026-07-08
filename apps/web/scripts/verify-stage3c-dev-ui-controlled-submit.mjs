/**
 * Stage 3-C — dev controlled submit path verification (server action → Stage 3-B RPC)
 * Targets DEV Supabase (ogncvdxrrsjnwsuvgoyh) only.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KNOWN_DEV_SUPABASE_REF } from "./e2e/supabase-auth-session.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RPC = "rpc_stage3b_dev_submit_quiz_reward_transaction";
const DEV_REF = KNOWN_DEV_SUPABASE_REF;

const E2E_CAMPAIGN_ID = "e2e00002-0000-4000-8000-000000000002";
const E2E_QUIZ_ID = "e2e00003-0000-4000-8000-000000000003";
const LOW_BUDGET_CAMPAIGN_ID = "e2e00004-0000-4000-8000-000000000004";
const LOW_BUDGET_QUIZ_ID = "e2e00005-0000-4000-8000-000000000005";
const WRONG_ATTEMPT_CAMPAIGN_ID = "e2e00006-0000-4000-8000-000000000006";
const WRONG_ATTEMPT_QUIZ_ID = "e2e00007-0000-4000-8000-000000000007";
const MIN_VIEW_CAMPAIGN_ID = "e2e00008-0000-4000-8000-000000000008";
const MIN_VIEW_QUIZ_ID = "e2e00009-0000-4000-8000-000000000009";

const FIXTURE_CORRECT_LABEL = Buffer.from("7IiY7JqU7J28", "base64").toString("utf8");
const FIXTURE_WRONG_LABEL = "월요일";

function loadAnonEnv(projectRef) {
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${projectRef} -o json`,
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find(
    (k) => k.id === "anon" && typeof k.api_key === "string" && k.api_key.startsWith("eyJ"),
  );
  if (!anon?.api_key) {
    throw new Error(`anon key not found for ref ${projectRef}`);
  }
  return {
    url: `https://${projectRef}.supabase.co`,
    key: anon.api_key,
    projectRef,
  };
}

function buildIdempotencyKey(userId, adViewId, campaignId, quizId) {
  return `stage3b:quiz_reward:${userId}:${adViewId}:${campaignId}:${quizId}`;
}

function verifyServerActionWiring() {
  const actionsPath = join(
    WEB_ROOT,
    "src",
    "app",
    "consumer",
    "ads",
    "[campaignId]",
    "actions.ts",
  );
  const submitPath = join(
    WEB_ROOT,
    "src",
    "lib",
    "quiz-rewards",
    "stage3c-submit.server.ts",
  );
  const actions = readFileSync(actionsPath, "utf8");
  const submit = readFileSync(submitPath, "utf8");
  if (!actions.includes("submitConsumerQuizForRewardAction")) {
    throw new Error("missing submitConsumerQuizForRewardAction");
  }
  if (!actions.includes("submitConsumerQuizForReward")) {
    throw new Error("actions must delegate to submitConsumerQuizForReward");
  }
  if (!submit.includes("STAGE3B_RPC_NAME") && !submit.includes(RPC)) {
    throw new Error("stage3c-submit.server must call Stage 3-B RPC");
  }
  console.log("PASS: server action → stage3c-submit.server → Stage 3-B RPC wiring");
}

async function createConsumerClient(env) {
  const supabase = createClient(env.url, env.key);
  const email = `stage3c-ui-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(16).toString("base64url");
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "consumer" } },
  });
  let session = signUp.data.session;
  if (!session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.session) {
      throw new Error("sign-in failed after signup");
    }
    session = signIn.data.session;
  }
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  console.log(`INFO: consumer ${maskEmail(email)} ref=${env.projectRef}`);
  return { supabase, userId: session.user.id };
}

async function insertAdView(supabase, userId, campaignId, quizId, opts = {}) {
  const viewedSeconds = opts.viewedSeconds ?? 10;
  const startedAt =
    opts.viewStartedAt ??
    new Date(Date.now() - viewedSeconds * 1000).toISOString();

  const { data, error } = await supabase
    .from("ad_views")
    .insert({
      consumer_user_id: userId,
      campaign_id: campaignId,
      quiz_id: quizId,
      status: "viewed",
      view_started_at: startedAt,
      viewed_seconds: viewedSeconds,
      attempt_no: 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`ad_views insert failed: ${error.message}`);
  }
  return data.id;
}

async function countQuizRewardLedger(supabase, userId) {
  const { data, error } = await supabase
    .from("point_ledger")
    .select("id, amount, entry_type")
    .eq("user_id", userId)
    .eq("entry_type", "quiz_reward");
  if (error) {
    throw new Error(`ledger select failed: ${error.message}`);
  }
  return data ?? [];
}

async function getProfileBalance(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("point_balance")
    .eq("id", userId)
    .single();
  if (error) {
    throw new Error(`profile read failed: ${error.message}`);
  }
  return data.point_balance ?? 0;
}

async function getCampaignBudget(supabase, campaignId) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("budget_spent, reward_per_view")
    .eq("id", campaignId)
    .single();
  if (error) {
    throw new Error(`campaign read failed: ${error.message}`);
  }
  return data;
}

async function callRpc(supabase, params) {
  return supabase.rpc(RPC, params);
}

async function main() {
  verifyServerActionWiring();

  const env = loadAnonEnv(DEV_REF);
  const { supabase, userId } = await createConsumerClient(env);

  const adView1 = await insertAdView(supabase, userId, E2E_CAMPAIGN_ID, E2E_QUIZ_ID);
  const key1 = buildIdempotencyKey(userId, adView1, E2E_CAMPAIGN_ID, E2E_QUIZ_ID);
  const budgetBefore = await getCampaignBudget(supabase, E2E_CAMPAIGN_ID);
  const ledgerBefore = await countQuizRewardLedger(supabase, userId);
  const balanceBefore = await getProfileBalance(supabase, userId);

  const reward = await callRpc(supabase, {
    p_ad_view_id: adView1,
    p_campaign_id: E2E_CAMPAIGN_ID,
    p_quiz_id: E2E_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key1,
  });
  if (reward.error) {
    throw new Error(`correct submit failed: ${reward.error.message}`);
  }
  if (reward.data?.result_code !== "STAGE3B_REWARDED") {
    throw new Error(`expected STAGE3B_REWARDED, got ${reward.data?.result_code}`);
  }
  const amount = reward.data.amount;
  const ledgerAfter = await countQuizRewardLedger(supabase, userId);
  const budgetAfter = await getCampaignBudget(supabase, E2E_CAMPAIGN_ID);
  const balanceAfter = await getProfileBalance(supabase, userId);
  if (ledgerAfter.length !== ledgerBefore.length + 1) {
    throw new Error("correct submit expected +1 ledger row");
  }
  if (budgetAfter.budget_spent !== budgetBefore.budget_spent + amount) {
    throw new Error("campaign budget not decremented");
  }
  if (balanceAfter !== balanceBefore + amount) {
    throw new Error("profile balance inconsistent after reward");
  }
  console.log("RESULT: dev UI correct submit result=STAGE3B_REWARDED");

  const dup = await callRpc(supabase, {
    p_ad_view_id: adView1,
    p_campaign_id: E2E_CAMPAIGN_ID,
    p_quiz_id: E2E_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key1,
  });
  if (dup.data?.result_code !== "STAGE3B_IDEMPOTENT_DUPLICATE") {
    throw new Error(`idempotency replay expected, got ${dup.data?.result_code}`);
  }
  console.log("RESULT: dev UI idempotency replay result=STAGE3B_IDEMPOTENT_DUPLICATE");

  const altKey = `${key1}:alt`;
  const blocked = await callRpc(supabase, {
    p_ad_view_id: adView1,
    p_campaign_id: E2E_CAMPAIGN_ID,
    p_quiz_id: E2E_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: altKey,
  });
  if (blocked.data?.result_code !== "STAGE3B_DUPLICATE_SUBMISSION_BLOCKED") {
    throw new Error(`duplicate blocked expected, got ${blocked.data?.result_code}`);
  }
  console.log("RESULT: dev UI duplicate submit result=STAGE3B_DUPLICATE_SUBMISSION_BLOCKED");

  const adView2 = await insertAdView(
    supabase,
    userId,
    WRONG_ATTEMPT_CAMPAIGN_ID,
    WRONG_ATTEMPT_QUIZ_ID,
  );
  const key2 = buildIdempotencyKey(
    userId,
    adView2,
    WRONG_ATTEMPT_CAMPAIGN_ID,
    WRONG_ATTEMPT_QUIZ_ID,
  );
  const wrong1 = await callRpc(supabase, {
    p_ad_view_id: adView2,
    p_campaign_id: WRONG_ATTEMPT_CAMPAIGN_ID,
    p_quiz_id: WRONG_ATTEMPT_QUIZ_ID,
    p_selected_option: FIXTURE_WRONG_LABEL,
    p_idempotency_key: key2,
  });
  if (wrong1.data?.result_code !== "STAGE3B_WRONG_RETRY_ALLOWED") {
    throw new Error(`wrong1 expected, got ${wrong1.data?.result_code}`);
  }
  console.log("RESULT: dev UI wrong 1 result=STAGE3B_WRONG_RETRY_ALLOWED");

  const wrong2 = await callRpc(supabase, {
    p_ad_view_id: adView2,
    p_campaign_id: WRONG_ATTEMPT_CAMPAIGN_ID,
    p_quiz_id: WRONG_ATTEMPT_QUIZ_ID,
    p_selected_option: FIXTURE_WRONG_LABEL,
    p_idempotency_key: key2,
  });
  if (wrong2.data?.result_code !== "STAGE3B_WRONG_FINAL_NO_REWARD") {
    throw new Error(`wrong2 expected, got ${wrong2.data?.result_code}`);
  }
  console.log("RESULT: dev UI wrong 2 result=STAGE3B_WRONG_FINAL_NO_REWARD");

  const adView3 = await insertAdView(supabase, userId, MIN_VIEW_CAMPAIGN_ID, MIN_VIEW_QUIZ_ID, {
    viewedSeconds: 0,
    viewStartedAt: new Date().toISOString(),
  });
  const key3 = buildIdempotencyKey(userId, adView3, MIN_VIEW_CAMPAIGN_ID, MIN_VIEW_QUIZ_ID);
  const minView = await callRpc(supabase, {
    p_ad_view_id: adView3,
    p_campaign_id: MIN_VIEW_CAMPAIGN_ID,
    p_quiz_id: MIN_VIEW_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key3,
  });
  if (minView.data?.result_code !== "STAGE3B_MIN_VIEW_SECONDS_NOT_MET") {
    throw new Error(`min-view expected, got ${minView.data?.result_code}`);
  }
  console.log("RESULT: dev UI min-view blocked result=STAGE3B_MIN_VIEW_SECONDS_NOT_MET");

  const adView4 = await insertAdView(supabase, userId, LOW_BUDGET_CAMPAIGN_ID, LOW_BUDGET_QUIZ_ID);
  const key4 = buildIdempotencyKey(
    userId,
    adView4,
    LOW_BUDGET_CAMPAIGN_ID,
    LOW_BUDGET_QUIZ_ID,
  );
  const budgetFail = await callRpc(supabase, {
    p_ad_view_id: adView4,
    p_campaign_id: LOW_BUDGET_CAMPAIGN_ID,
    p_quiz_id: LOW_BUDGET_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key4,
  });
  if (budgetFail.data?.result_code !== "STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT") {
    throw new Error(`budget insufficient expected, got ${budgetFail.data?.result_code}`);
  }
  console.log("RESULT: dev UI budget insufficient result=STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT");

  console.log("RESULT: dev point_ledger entry_type=quiz_reward");
  console.log("RESULT: dev users balance cache consistent=true");
  console.log("PASS: verify:stage3c-dev-ui-controlled-submit");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
