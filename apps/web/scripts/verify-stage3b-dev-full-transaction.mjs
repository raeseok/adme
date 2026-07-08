/**
 * Stage 3-B — dev-only full transaction verification
 * Targets DEV Supabase (ogncvdxrrsjnwsuvgoyh) only.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  KNOWN_DEV_SUPABASE_REF,
  KNOWN_PROD_SUPABASE_REF,
} from "./e2e/supabase-auth-session.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
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
const ROLLBACK_CAMPAIGN_ID = "e2e0000a-0000-4000-8000-00000000000a";
const ROLLBACK_QUIZ_ID = "e2e0000b-0000-4000-8000-00000000000b";

/** Fixture answer label — never logged in plaintext */
const FIXTURE_CORRECT_LABEL = Buffer.from("7IiY7JqU7J28", "base64").toString("utf8");
const FIXTURE_WRONG_LABEL = "월요일";

const FORBIDDEN_PAYLOAD = [
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
  "quiz_answer",
];

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

function assertNoAnswerExposure(payload) {
  const text = JSON.stringify(payload);
  for (const forbidden of FORBIDDEN_PAYLOAD) {
    if (text.includes(forbidden)) {
      throw new Error(`RPC payload exposes ${forbidden}`);
    }
  }
}

async function createConsumerClient(env) {
  const supabase = createClient(env.url, env.key);
  const email = `stage3b-ft-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(16).toString("base64url");
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "consumer" } },
  });
  if (signUp.error && !signUp.error.message.toLowerCase().includes("registered")) {
    throw new Error(`signup failed: ${signUp.error.message}`);
  }
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
  return { supabase, session, userId: session.user.id };
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
      attempt_no: opts.attemptNo ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`ad_views insert failed: ${error.message}`);
  }
  return data.id;
}

async function getCampaignBudget(supabase, campaignId) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("budget_spent, budget_total, reward_per_view")
    .eq("id", campaignId)
    .single();
  if (error) {
    throw new Error(`campaign read failed: ${error.message}`);
  }
  return data;
}

async function countQuizRewardLedger(supabase, userId) {
  const { data, error } = await supabase
    .from("point_ledger")
    .select("id, amount, entry_type, metadata")
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

async function callRpc(supabase, params) {
  return supabase.rpc(RPC, params);
}

async function main() {
  if (DEV_REF === KNOWN_PROD_SUPABASE_REF) {
    throw new Error("dev/prod refs must differ");
  }

  const env = loadAnonEnv(DEV_REF);
  console.log(`INFO: Stage 3-B full transaction target ref=${env.projectRef}`);

  const { supabase, userId } = await createConsumerClient(env);

  // 1) correct answer reward
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
    throw new Error(`reward RPC failed: ${reward.error.message}`);
  }
  assertNoAnswerExposure(reward.data);
  if (reward.data?.result_code !== "STAGE3B_REWARDED") {
    throw new Error(`expected STAGE3B_REWARDED, got ${reward.data?.result_code}`);
  }
  const amount = reward.data.amount;
  const budgetAfter = await getCampaignBudget(supabase, E2E_CAMPAIGN_ID);
  const ledgerAfter = await countQuizRewardLedger(supabase, userId);
  const balanceAfter = await getProfileBalance(supabase, userId);

  if (ledgerAfter.length !== ledgerBefore.length + 1) {
    throw new Error(`ledger expected +1, got ${ledgerAfter.length - ledgerBefore.length}`);
  }
  if (ledgerAfter.some((r) => r.entry_type !== "quiz_reward")) {
    throw new Error("ledger entry_type must be quiz_reward");
  }
  if (budgetAfter.budget_spent !== budgetBefore.budget_spent + amount) {
    throw new Error("campaign budget_spent not decremented correctly");
  }
  if (balanceAfter !== balanceBefore + amount) {
    throw new Error(`profile balance inconsistent: ${balanceBefore} + ${amount} != ${balanceAfter}`);
  }
  const ledgerSum = ledgerAfter.reduce((s, r) => s + Number(r.amount), 0);
  if (balanceAfter !== ledgerSum) {
    throw new Error("ledger sum vs profile.point_balance mismatch");
  }
  console.log("PASS: correct answer reward — ledger, budget, balance");

  // 2) idempotent duplicate
  const dup = await callRpc(supabase, {
    p_ad_view_id: adView1,
    p_campaign_id: E2E_CAMPAIGN_ID,
    p_quiz_id: E2E_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key1,
  });
  if (dup.error) {
    throw new Error(`idempotent RPC failed: ${dup.error.message}`);
  }
  if (dup.data?.result_code !== "STAGE3B_IDEMPOTENT_DUPLICATE") {
    throw new Error(`expected idempotent duplicate, got ${dup.data?.result_code}`);
  }
  const ledgerDup = await countQuizRewardLedger(supabase, userId);
  const budgetDup = await getCampaignBudget(supabase, E2E_CAMPAIGN_ID);
  if (ledgerDup.length !== ledgerAfter.length) {
    throw new Error("idempotent replay inserted extra ledger row");
  }
  if (budgetDup.budget_spent !== budgetAfter.budget_spent) {
    throw new Error("idempotent replay changed budget");
  }
  console.log("PASS: idempotent duplicate — no extra mutation");

  // 3) duplicate submit different key after reward
  const altKey = `${key1}:alt`;
  const blocked = await callRpc(supabase, {
    p_ad_view_id: adView1,
    p_campaign_id: E2E_CAMPAIGN_ID,
    p_quiz_id: E2E_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: altKey,
  });
  if (blocked.error) {
    throw new Error(`duplicate key RPC error: ${blocked.error.message}`);
  }
  if (blocked.data?.result_code !== "STAGE3B_DUPLICATE_SUBMISSION_BLOCKED") {
    throw new Error(
      `expected DUPLICATE_SUBMISSION_BLOCKED, got ${blocked.data?.result_code}`,
    );
  }
  console.log("PASS: duplicate submit with different key blocked");

  // 4) wrong answer 1st attempt
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
  const ledgerBeforeWrong1 = await countQuizRewardLedger(supabase, userId);
  const budgetBeforeWrong1 = await getCampaignBudget(supabase, WRONG_ATTEMPT_CAMPAIGN_ID);

  const wrong1 = await callRpc(supabase, {
    p_ad_view_id: adView2,
    p_campaign_id: WRONG_ATTEMPT_CAMPAIGN_ID,
    p_quiz_id: WRONG_ATTEMPT_QUIZ_ID,
    p_selected_option: FIXTURE_WRONG_LABEL,
    p_idempotency_key: key2,
  });
  if (wrong1.error) {
    throw new Error(`wrong1 RPC failed: ${wrong1.error.message}`);
  }
  if (wrong1.data?.result_code !== "STAGE3B_WRONG_RETRY_ALLOWED") {
    throw new Error(`expected WRONG_RETRY_ALLOWED, got ${wrong1.data?.result_code}`);
  }
  if (wrong1.data?.remaining_attempts !== 1) {
    throw new Error(`remaining_attempts expected 1, got ${wrong1.data?.remaining_attempts}`);
  }
  const ledgerWrong1 = await countQuizRewardLedger(supabase, userId);
  const budgetWrong1 = await getCampaignBudget(supabase, WRONG_ATTEMPT_CAMPAIGN_ID);
  if (ledgerWrong1.length !== ledgerBeforeWrong1.length) {
    throw new Error("wrong1 should not insert ledger");
  }
  if (budgetWrong1.budget_spent !== budgetBeforeWrong1.budget_spent) {
    throw new Error("wrong1 should not change budget");
  }
  console.log("PASS: wrong answer 1st attempt — no reward");

  // 5) wrong answer 2nd attempt
  const wrong2 = await callRpc(supabase, {
    p_ad_view_id: adView2,
    p_campaign_id: WRONG_ATTEMPT_CAMPAIGN_ID,
    p_quiz_id: WRONG_ATTEMPT_QUIZ_ID,
    p_selected_option: FIXTURE_WRONG_LABEL,
    p_idempotency_key: key2,
  });
  if (wrong2.error) {
    throw new Error(`wrong2 RPC failed: ${wrong2.error.message}`);
  }
  if (wrong2.data?.result_code !== "STAGE3B_WRONG_FINAL_NO_REWARD") {
    throw new Error(`expected WRONG_FINAL, got ${wrong2.data?.result_code}`);
  }
  if (wrong2.data?.remaining_attempts !== 0) {
    throw new Error(`remaining_attempts expected 0, got ${wrong2.data?.remaining_attempts}`);
  }
  console.log("PASS: wrong answer 2nd attempt — final failed");

  // 6) min view failure
  const adView3 = await insertAdView(supabase, userId, MIN_VIEW_CAMPAIGN_ID, MIN_VIEW_QUIZ_ID, {
    viewedSeconds: 0,
    viewStartedAt: new Date().toISOString(),
  });
  const key3 = buildIdempotencyKey(userId, adView3, MIN_VIEW_CAMPAIGN_ID, MIN_VIEW_QUIZ_ID);
  const ledgerBeforeMin = await countQuizRewardLedger(supabase, userId);
  const minView = await callRpc(supabase, {
    p_ad_view_id: adView3,
    p_campaign_id: MIN_VIEW_CAMPAIGN_ID,
    p_quiz_id: MIN_VIEW_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key3,
  });
  if (minView.error) {
    throw new Error(`min view RPC failed: ${minView.error.message}`);
  }
  if (minView.data?.result_code !== "STAGE3B_MIN_VIEW_SECONDS_NOT_MET") {
    throw new Error(`expected MIN_VIEW_SECONDS_NOT_MET, got ${minView.data?.result_code}`);
  }
  const ledgerMin = await countQuizRewardLedger(supabase, userId);
  if (ledgerMin.length !== ledgerBeforeMin.length) {
    throw new Error("min view failure inserted ledger");
  }
  console.log("PASS: min view failure — no mutation");

  // 7) budget insufficient
  const adView4 = await insertAdView(supabase, userId, LOW_BUDGET_CAMPAIGN_ID, LOW_BUDGET_QUIZ_ID);
  const key4 = buildIdempotencyKey(
    userId,
    adView4,
    LOW_BUDGET_CAMPAIGN_ID,
    LOW_BUDGET_QUIZ_ID,
  );
  const ledgerBeforeBudget = await countQuizRewardLedger(supabase, userId);
  const balanceBeforeBudget = await getProfileBalance(supabase, userId);
  const budgetFail = await callRpc(supabase, {
    p_ad_view_id: adView4,
    p_campaign_id: LOW_BUDGET_CAMPAIGN_ID,
    p_quiz_id: LOW_BUDGET_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key4,
  });
  if (budgetFail.error) {
    throw new Error(`budget fail RPC error: ${budgetFail.error.message}`);
  }
  if (budgetFail.data?.result_code !== "STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT") {
    throw new Error(
      `expected BUDGET_INSUFFICIENT, got ${budgetFail.data?.result_code}`,
    );
  }
  const ledgerBudget = await countQuizRewardLedger(supabase, userId);
  const balanceBudget = await getProfileBalance(supabase, userId);
  if (ledgerBudget.length !== ledgerBeforeBudget.length) {
    throw new Error("budget insufficient inserted ledger");
  }
  if (balanceBudget !== balanceBeforeBudget) {
    throw new Error("budget insufficient changed balance");
  }
  console.log("PASS: campaign budget insufficient — no mutation");

  // 8) forced rollback
  const adView5 = await insertAdView(supabase, userId, ROLLBACK_CAMPAIGN_ID, ROLLBACK_QUIZ_ID);
  const key5 = buildIdempotencyKey(userId, adView5, ROLLBACK_CAMPAIGN_ID, ROLLBACK_QUIZ_ID);
  const budgetBeforeRb = await getCampaignBudget(supabase, ROLLBACK_CAMPAIGN_ID);
  const ledgerBeforeRb = await countQuizRewardLedger(supabase, userId);
  const balanceBeforeRb = await getProfileBalance(supabase, userId);

  const rollback = await callRpc(supabase, {
    p_ad_view_id: adView5,
    p_campaign_id: ROLLBACK_CAMPAIGN_ID,
    p_quiz_id: ROLLBACK_QUIZ_ID,
    p_selected_option: FIXTURE_CORRECT_LABEL,
    p_idempotency_key: key5,
    p_dev_force_rollback_after_budget: true,
  });
  if (!rollback.error) {
    throw new Error("forced rollback should raise error");
  }
  if (!rollback.error.message.includes("STAGE3B_DEV_FORCED_ROLLBACK")) {
    throw new Error(`expected DEV_FORCED_ROLLBACK, got ${rollback.error.message}`);
  }
  const budgetRb = await getCampaignBudget(supabase, ROLLBACK_CAMPAIGN_ID);
  const ledgerRb = await countQuizRewardLedger(supabase, userId);
  const balanceRb = await getProfileBalance(supabase, userId);
  if (budgetRb.budget_spent !== budgetBeforeRb.budget_spent) {
    throw new Error("forced rollback did not restore budget");
  }
  if (ledgerRb.length !== ledgerBeforeRb.length) {
    throw new Error("forced rollback did not restore ledger count");
  }
  if (balanceRb !== balanceBeforeRb) {
    throw new Error("forced rollback did not restore balance");
  }
  const { data: adViewRb } = await supabase
    .from("ad_views")
    .select("status, points_earned")
    .eq("id", adView5)
    .single();
  if (adViewRb?.status === "rewarded" || (adViewRb?.points_earned ?? 0) > 0) {
    throw new Error("forced rollback left ad_views rewarded");
  }
  console.log("PASS: forced rollback — full restore");

  // role gate — advertiser/partner/admin blocked (no ad_views insert required)
  for (const role of ["advertiser", "partner", "admin"]) {
    const roleClient = createClient(env.url, env.key);
    const email = `stage3b-role-${role}-${Date.now()}@example.com`;
    const password = randomBytes(16).toString("base64url");
    const signUp = await roleClient.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    let session = signUp.data.session;
    if (!session) {
      const signIn = await roleClient.auth.signInWithPassword({ email, password });
      session = signIn.data.session;
    }
    await roleClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    const fakeAdViewId = randomUUID();
    const keyRole = buildIdempotencyKey(
      session.user.id,
      fakeAdViewId,
      E2E_CAMPAIGN_ID,
      E2E_QUIZ_ID,
    );
    const roleRpc = await callRpc(roleClient, {
      p_ad_view_id: fakeAdViewId,
      p_campaign_id: E2E_CAMPAIGN_ID,
      p_quiz_id: E2E_QUIZ_ID,
      p_selected_option: FIXTURE_CORRECT_LABEL,
      p_idempotency_key: keyRole,
    });
    if (roleRpc.error) {
      throw new Error(`${role} RPC unexpected error: ${roleRpc.error.message}`);
    }
    if (roleRpc.data?.result_code !== "STAGE3B_CONSUMER_ROLE_REQUIRED") {
      throw new Error(
        `${role} RPC expected CONSUMER_ROLE_REQUIRED, got ${roleRpc.data?.result_code}`,
      );
    }
    console.log(`PASS: ${role} RPC blocked — STAGE3B_CONSUMER_ROLE_REQUIRED`);
  }

  console.log(
    `INFO: usersBalanceCachePresent=true ledgerSum=${balanceAfter} consistent=true`,
  );
  console.log(`INFO: idempotency key hash sample=${createHash("sha256").update(key1).digest("hex").slice(0, 16)}`);
  console.log("PASS: verify:stage3b-dev-full-transaction");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
