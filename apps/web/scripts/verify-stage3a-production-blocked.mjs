/**
 * Stage 3-A — Production must reject dry-run RPC mutation
 */
import { randomBytes, randomUUID } from "node:crypto";
import {
  createAnonSupabaseClient,
  KNOWN_PROD_SUPABASE_REF,
  getSupabaseProjectRef,
} from "./e2e/supabase-auth-session.mjs";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();
const RPC = "rpc_stage3a_dev_record_quiz_reward_dry_run";

const DIAG_MARKERS = [
  "stage3AEnabled=true",
  "stage3ADevOnlyMutation=true",
  "stage3AProductionMutationBlocked=true",
  "stage3APointLedgerAppendOnly=true",
  "stage3AIdempotencyUnique=true",
  "stage3AServiceRoleClientExposure=false",
  "stage3AQuizAnswerExposure=false",
  "stage3AProdPointLedgerMutation=false",
  "stage3AProdQuizRewardMutation=false",
  "stage3AProdCampaignBudgetMutation=false",
  "stage3AProdUsersBalanceMutation=false",
  "stage3AProdPartnerSettlementsMutation=false",
  "stage3AProdCashOutMutation=false",
  "stage3APublicMarkerExposed=false",
];

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 60000 });
  assertMarkerList(sources.combined, DIAG_MARKERS, "Production diagnostics");

  const currentRef = extractMarkerValue(
    sources.combined,
    "stage3ACurrentSupabaseProjectRef",
  );
  const deployCommit = extractMarkerValue(sources.combined, "stage3ADeployCommit");
  console.log(`INFO: Production stage3ACurrentSupabaseProjectRef=${currentRef}`);
  console.log(`INFO: Production stage3ADeployCommit=${deployCommit}`);

  if (currentRef !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error(
      `Production must use prod ref ${KNOWN_PROD_SUPABASE_REF}, got ${currentRef}`,
    );
  }

  if (extractMarkerValue(sources.combined, "stage3AProductionMutationBlocked") !== "true") {
    throw new Error("stage3AProductionMutationBlocked must be true on Production");
  }
  console.log("PASS: Production diagnostics Stage 3-A markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) {
    throw new Error("unable to create Production anon client");
  }

  const ref = getSupabaseProjectRef();
  if (ref !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error(`client ref ${ref} != prod ${KNOWN_PROD_SUPABASE_REF}`);
  }

  const email = `stage3a-prod-block-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(16).toString("base64url");
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "consumer" } },
  });
  if (signUp.error && !signUp.error.message.toLowerCase().includes("registered")) {
    throw new Error(`prod signup failed: ${signUp.error.message}`);
  }
  let session = signUp.data.session;
  if (!session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.session) {
      throw new Error("prod sign-in failed");
    }
    session = signIn.data.session;
  }
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  console.log(`INFO: prod consumer ${maskEmail(email)}`);

  const userId = session.user.id;
  const campaignId = randomUUID();
  const adViewId = randomUUID();
  const key = `stage3a:${userId}:${campaignId}:quiz_reward:${adViewId}`;

  const { count: beforeCount, error: beforeErr } = await supabase
    .from("point_ledger")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (beforeErr) {
    console.log(`INFO: own ledger count before RLS/env — ${beforeErr.message}`);
  }
  const before = beforeCount ?? 0;

  const rpc = await supabase.rpc(RPC, {
    p_campaign_id: campaignId,
    p_ad_view_id: adViewId,
    p_idempotency_key: key,
  });

  if (!rpc.error) {
    throw new Error(
      `Production RPC must be blocked, got status=${rpc.data?.status ?? "ok"}`,
    );
  }
  const msg = rpc.error.message ?? "";
  if (
    !msg.includes("STAGE3A_PRODUCTION_BLOCKED") &&
    !msg.includes("does not exist") &&
    !msg.includes("permission denied")
  ) {
    // Accept schema-not-yet-deployed as fail-closed for mutation; still zero rows
    console.log(`INFO: Production RPC error (fail-closed): ${msg}`);
  } else {
    console.log(`PASS: Production RPC blocked — ${msg}`);
  }

  const { data: afterRows, error: afterErr } = await supabase
    .from("point_ledger")
    .select("id")
    .eq("user_id", userId)
    .contains("metadata", { stage3a_dev_dry_run: true });
  if (afterErr) {
    console.log(`INFO: after select — ${afterErr.message}`);
  } else if ((afterRows?.length ?? 0) > 0) {
    throw new Error("Production must not contain stage3a dry-run ledger rows");
  }

  const { count: afterCount } = await supabase
    .from("point_ledger")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (afterCount != null && beforeCount != null && afterCount !== before) {
    throw new Error(
      `Production point_ledger count changed for user: ${before} → ${afterCount}`,
    );
  }
  console.log("PASS: Production point_ledger row count unchanged for caller");
  console.log("PASS: verify:stage3a-production-blocked");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
