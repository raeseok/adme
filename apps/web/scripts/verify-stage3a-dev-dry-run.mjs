/**
 * Stage 3-A — dev-only point_ledger dry-run mutation verification
 *
 * Targets DEV Supabase (ogncvdxrrsjnwsuvgoyh) only.
 * Never points Production base URL at production mutation.
 */
import { randomBytes, randomUUID } from "node:crypto";
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
const RPC = "rpc_stage3a_dev_record_quiz_reward_dry_run";
const DEV_REF = KNOWN_DEV_SUPABASE_REF;
const PROD_REF = KNOWN_PROD_SUPABASE_REF;

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

function buildIdempotencyKey(userId, campaignId, adViewId) {
  return `stage3a:${userId}:${campaignId}:quiz_reward:${adViewId}`;
}

async function createConsumerClient(env) {
  const supabase = createClient(env.url, env.key);
  const email = `stage3a-dry-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
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
  return { supabase, session, email };
}

async function countOwnStage3ARows(supabase, userId) {
  const { data, error } = await supabase
    .from("point_ledger")
    .select("id, amount, idempotency_key, metadata")
    .eq("user_id", userId)
    .eq("entry_type", "ad_reward")
    .contains("metadata", { stage3a_dev_dry_run: true });
  if (error) {
    throw new Error(`own ledger select failed: ${error.message}`);
  }
  return data ?? [];
}

async function main() {
  if (DEV_REF === PROD_REF) {
    throw new Error("dev/prod refs must differ");
  }

  const env = loadAnonEnv(DEV_REF);
  if (env.projectRef !== DEV_REF) {
    throw new Error(`expected dev ref ${DEV_REF}`);
  }
  console.log(`INFO: Stage 3-A dry-run target ref=${env.projectRef}`);

  const { supabase, session } = await createConsumerClient(env);
  const userId = session.user.id;
  const campaignId = randomUUID();
  const adViewId = randomUUID();
  const key = buildIdempotencyKey(userId, campaignId, adViewId);

  const before = await countOwnStage3ARows(supabase, userId);

  const first = await supabase.rpc(RPC, {
    p_campaign_id: campaignId,
    p_ad_view_id: adViewId,
    p_idempotency_key: key,
  });
  if (first.error) {
    throw new Error(`first RPC failed: ${first.error.message}`);
  }
  if (first.data?.status !== "rewarded") {
    throw new Error(`first RPC status expected rewarded, got ${first.data?.status}`);
  }
  if (first.data?.rewardAmount !== 100) {
    throw new Error(`rewardAmount expected 100, got ${first.data?.rewardAmount}`);
  }
  // Must never expose quiz answers
  const payload = JSON.stringify(first.data);
  for (const forbidden of [
    "correctAnswer",
    "correctOption",
    "correctIndex",
    "answerIndex",
    "solution",
    "quiz_answer",
  ]) {
    if (payload.includes(forbidden)) {
      throw new Error(`RPC payload exposes ${forbidden}`);
    }
  }
  console.log("PASS: first RPC rewarded (amount=100)");

  const afterFirst = await countOwnStage3ARows(supabase, userId);
  if (afterFirst.length !== before.length + 1) {
    throw new Error(
      `expected +1 ledger row, before=${before.length} after=${afterFirst.length}`,
    );
  }
  console.log(`PASS: point_ledger INSERT row delta=+1 (own stage3a rows=${afterFirst.length})`);

  const second = await supabase.rpc(RPC, {
    p_campaign_id: campaignId,
    p_ad_view_id: adViewId,
    p_idempotency_key: key,
  });
  if (second.error) {
    throw new Error(`idempotent RPC failed: ${second.error.message}`);
  }
  if (second.data?.status !== "idempotent_duplicate") {
    throw new Error(
      `second RPC expected idempotent_duplicate, got ${second.data?.status}`,
    );
  }
  const afterSecond = await countOwnStage3ARows(supabase, userId);
  if (afterSecond.length !== afterFirst.length) {
    throw new Error("idempotent replay inserted extra row");
  }
  console.log("PASS: identical idempotency key → no duplicate INSERT");

  // Conflict: same key shape but wrong amount via p_amount override attempt
  const conflictAmount = await supabase.rpc(RPC, {
    p_campaign_id: campaignId,
    p_ad_view_id: adViewId,
    p_idempotency_key: key,
    p_amount: 999,
  });
  if (!conflictAmount.error) {
    throw new Error("expected STAGE3A_AMOUNT_FORBIDDEN for forged amount");
  }
  console.log(`PASS: forged amount rejected — ${conflictAmount.error.message}`);

  // Conflict: key bound to another campaign id
  const wrongCampaignKey = buildIdempotencyKey(userId, randomUUID(), adViewId);
  const conflictKey = await supabase.rpc(RPC, {
    p_campaign_id: campaignId,
    p_ad_view_id: adViewId,
    p_idempotency_key: wrongCampaignKey,
  });
  if (!conflictKey.error) {
    throw new Error("expected STAGE3A_IDEMPOTENCY_KEY_MISMATCH");
  }
  console.log(`PASS: mismatched idempotency key rejected — ${conflictKey.error.message}`);

  // Direct client INSERT must be denied by RLS (no INSERT policy)
  const direct = await supabase.from("point_ledger").insert({
    account_type: "consumer",
    user_id: userId,
    entry_type: "ad_reward",
    amount: 50,
    description: "stage3a-should-fail",
    metadata: { stage3a: true },
  });
  if (!direct.error) {
    throw new Error("direct point_ledger INSERT should be blocked by RLS");
  }
  console.log(`PASS: direct INSERT blocked — ${direct.error.message}`);

  // UPDATE/DELETE blocked by append-only triggers (even if RLS somehow allowed)
  if (afterFirst[0]?.id) {
    const upd = await supabase
      .from("point_ledger")
      .update({ description: "mutate" })
      .eq("id", afterFirst[0].id);
    if (!upd.error) {
      // RLS may silently block with zero rows — also accept empty update without error
      // Probe via select: description must remain original
      const { data: check } = await supabase
        .from("point_ledger")
        .select("description")
        .eq("id", afterFirst[0].id)
        .maybeSingle();
      if (check?.description === "mutate") {
        throw new Error("point_ledger UPDATE should not succeed");
      }
    }
    console.log("PASS: UPDATE path blocked or no-op (append-only)");

    const del = await supabase.from("point_ledger").delete().eq("id", afterFirst[0].id);
    if (!del.error) {
      const { data: still } = await supabase
        .from("point_ledger")
        .select("id")
        .eq("id", afterFirst[0].id)
        .maybeSingle();
      if (!still) {
        throw new Error("point_ledger DELETE should not succeed");
      }
    }
    console.log("PASS: DELETE path blocked or no-op (append-only)");
  }

  console.log("PASS: verify:stage3a-dev-dry-run");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
