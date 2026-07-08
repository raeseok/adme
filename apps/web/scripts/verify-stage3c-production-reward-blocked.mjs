/**
 * Stage 3-C — Production must block reward mutation via app gate + RPC
 */
import { randomBytes, randomUUID } from "node:crypto";
import { chromium } from "playwright";
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
  "stage3CConsumerQuizSubmitUi=true",
  "stage3CProductionRewardBlocked=true",
  "stage3CProductionPointLedgerMutation=false",
  "stage3CProductionCampaignBudgetMutation=false",
  "stage3CProductionUsersBalanceMutation=false",
  "stage3CProductionAdViewsMutation=false",
  "stage3CClientDirectRpcCall=false",
  "stage3CPublicMarkerExposed=false",
];

async function countTable(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return { count: count ?? 0, error };
}

async function verifyProductionUiBlocked() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/consumer/ads`, { waitUntil: "networkidle" });
    const listBody = await page.locator("body").innerText();
    if (listBody.includes("포인트 적립 완료") || listBody.includes("30P가 적립")) {
      throw new Error("production ads list shows completed reward copy");
    }

    await page.goto(
      `${BASE}/consumer/ads/stage2a-fixture-campaign-2`,
      { waitUntil: "networkidle" },
    );
    const detailBody = await page.locator("body").innerText();
    if (
      !detailBody.includes("현재 운영 환경에서는 포인트 적립 기능이 아직 열려 있지 않습니다")
    ) {
      throw new Error("production detail missing blocked UX notice");
    }
    if (detailBody.includes("포인트 적립 완료") || detailBody.includes("적립되었습니다")) {
      throw new Error("production detail shows completed reward copy");
    }
    console.log("PASS: production consumer UI blocked UX");
  } finally {
    await browser.close();
  }
}

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 90000 });
  assertMarkerList(sources.combined, DIAG_MARKERS, "Production diagnostics Stage 3-C");

  const currentRef = extractMarkerValue(
    sources.combined,
    "stage3CCurrentSupabaseProjectRef",
  );
  if (currentRef !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error(
      `Production must use prod ref ${KNOWN_PROD_SUPABASE_REF}, got ${currentRef}`,
    );
  }
  console.log("PASS: Production diagnostics Stage 3-C markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) {
    throw new Error("unable to create Production anon client");
  }
  if (getSupabaseProjectRef() !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error("client ref mismatch");
  }

  const email = `stage3c-prod-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
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
  if (!session) throw new Error("prod sign-in failed");
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  console.log(`INFO: prod consumer ${maskEmail(email)}`);

  const userId = session.user.id;
  const adViewId = randomUUID();
  const campaignId = "e2e00002-0000-4000-8000-000000000002";
  const quizId = "e2e00003-0000-4000-8000-000000000003";
  const key = `stage3b:quiz_reward:${userId}:${adViewId}:${campaignId}:${quizId}`;

  const ledgerBefore = await countTable(supabase, "point_ledger");
  const campaignsBefore = await countTable(supabase, "campaigns");
  const profilesBefore = await countTable(supabase, "profiles");
  const adViewsBefore = await countTable(supabase, "ad_views");

  const rpc = await supabase.rpc(RPC, {
    p_ad_view_id: adViewId,
    p_campaign_id: campaignId,
    p_quiz_id: quizId,
    p_selected_option: "수요일",
    p_idempotency_key: key,
  });

  if (!rpc.error) {
    throw new Error(
      `Production RPC must be blocked, got ${rpc.data?.result_code ?? "ok"}`,
    );
  }
  if (!rpc.error.message.includes("STAGE3B_PRODUCTION_BLOCKED")) {
    throw new Error(`expected STAGE3B_PRODUCTION_BLOCKED, got ${rpc.error.message}`);
  }
  console.log("PASS: Production RPC blocked");

  const ledgerAfter = await countTable(supabase, "point_ledger");
  const campaignsAfter = await countTable(supabase, "campaigns");
  const profilesAfter = await countTable(supabase, "profiles");
  const adViewsAfter = await countTable(supabase, "ad_views");

  if (ledgerAfter.count !== ledgerBefore.count) {
    throw new Error("Production point_ledger mutated");
  }
  if (campaignsAfter.count !== campaignsBefore.count) {
    throw new Error("Production campaigns mutated");
  }
  if (profilesAfter.count !== profilesBefore.count) {
    throw new Error("Production profiles count changed unexpectedly");
  }
  if (adViewsAfter.count !== adViewsBefore.count) {
    throw new Error("Production ad_views mutated");
  }

  await verifyProductionUiBlocked();

  console.log("RESULT: productionRewardMutationBlocked=true");
  console.log("RESULT: productionPointLedgerMutation=false");
  console.log("RESULT: productionCampaignBudgetMutation=false");
  console.log("RESULT: productionUsersBalanceMutation=false");
  console.log("RESULT: productionAdViewsMutation=false");
  console.log("PASS: verify:stage3c-production-reward-blocked");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
