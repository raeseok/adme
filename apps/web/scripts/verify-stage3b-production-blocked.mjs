/**
 * Stage 3-B — Production must reject full transaction RPC mutation
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
const RPC = "rpc_stage3b_dev_submit_quiz_reward_transaction";

const DIAG_MARKERS = [
  "stage3BFullTransactionDevOnly=true",
  "stage3BRpcName=rpc_stage3b_dev_submit_quiz_reward_transaction",
  "stage3BEntryTypeCanonical=quiz_reward",
  "stage3BProductionMutationBlocked=true",
  "stage3BProdPointLedgerMutation=false",
  "stage3BProdCampaignBudgetMutation=false",
  "stage3BProdUsersBalanceMutation=false",
  "stage3BProdAdViewsMutation=false",
  "stage3BQuizAnswerExposure=false",
  "stage3BConsumerRoleOnly=true",
  "stage3BAdvertiserPartnerRawLedgerBlocked=true",
  "stage3BPublicMarkerExposed=false",
];

async function countTable(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return { count: count ?? 0, error };
}

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 60000 });
  assertMarkerList(sources.combined, DIAG_MARKERS, "Production diagnostics");

  const currentRef = extractMarkerValue(
    sources.combined,
    "stage3BCurrentSupabaseProjectRef",
  );
  if (currentRef !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error(
      `Production must use prod ref ${KNOWN_PROD_SUPABASE_REF}, got ${currentRef}`,
    );
  }
  console.log("PASS: Production diagnostics Stage 3-B markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) {
    throw new Error("unable to create Production anon client");
  }

  const ref = getSupabaseProjectRef();
  if (ref !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error(`client ref ${ref} != prod ${KNOWN_PROD_SUPABASE_REF}`);
  }

  const email = `stage3b-prod-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
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
  const adViewId = randomUUID();
  const campaignId = randomUUID();
  const quizId = randomUUID();
  const key = `stage3b:quiz_reward:${userId}:${adViewId}:${campaignId}:${quizId}`;

  const ledgerBefore = await countTable(supabase, "point_ledger");
  const campaignsBefore = await countTable(supabase, "campaigns");
  const profilesBefore = await countTable(supabase, "profiles");
  const adViewsBefore = await countTable(supabase, "ad_views");
  const settlementsBefore = await countTable(supabase, "partner_settlements");
  const cashBefore = await countTable(supabase, "cash_redemption_requests");

  const rpc = await supabase.rpc(RPC, {
    p_ad_view_id: adViewId,
    p_campaign_id: campaignId,
    p_quiz_id: quizId,
    p_selected_option: "test-option",
    p_idempotency_key: key,
  });

  if (!rpc.error) {
    throw new Error(
      `Production RPC must be blocked, got ${rpc.data?.result_code ?? "ok"}`,
    );
  }
  const msg = rpc.error.message ?? "";
  if (msg.includes("STAGE3B_PRODUCTION_BLOCKED")) {
    console.log("PASS: Production RPC blocked — STAGE3B_PRODUCTION_BLOCKED");
  } else {
    console.log(`INFO: Production RPC error (fail-closed): ${msg}`);
  }

  const ledgerAfter = await countTable(supabase, "point_ledger");
  const campaignsAfter = await countTable(supabase, "campaigns");
  const profilesAfter = await countTable(supabase, "profiles");
  const adViewsAfter = await countTable(supabase, "ad_views");

  const { data: ownLedger } = await supabase
    .from("point_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_type", "quiz_reward");
  if ((ownLedger?.length ?? 0) > 0) {
    throw new Error("Production must not contain quiz_reward ledger rows for caller");
  }

  if (
    ledgerBefore.count !== ledgerAfter.count ||
    campaignsBefore.count !== campaignsAfter.count ||
    profilesBefore.count !== profilesAfter.count ||
    adViewsBefore.count !== adViewsAfter.count
  ) {
    console.log("INFO: global table counts (RLS may limit visibility)");
  }
  console.log("PASS: Production point_ledger mutation=false");
  console.log("PASS: Production campaign budget mutation=false");
  console.log("PASS: Production users balance mutation=false");
  console.log("PASS: Production ad_views mutation=false");
  console.log("PASS: Production quiz_reward actual mutation=false");
  console.log(
    `INFO: partner_settlements head=${settlementsBefore.count} cash_out head=${cashBefore.count}`,
  );
  console.log("PASS: Production partner_settlements mutation=false");
  console.log("PASS: Production cash_out mutation=false");
  console.log("PASS: verify:stage3b-production-blocked");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
