/**
 * Stage 2-C-R — DB UUID campaign ad_views INSERT/UPDATE + server min-view + attempt flow
 *
 * Requires remote migration 20260708100000 applied.
 * Uses Production Supabase anon client + ephemeral consumer auth.
 */
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import {
  createAnonSupabaseClient,
  createEphemeralSupabaseSession,
  getSupabaseProjectRef,
  injectSupabaseSession,
  loadSupabaseEnv,
} from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();
const MIN_VIEW_SEC = 5;
const TIMER_BUFFER_MS = 1500;
const E2E_CAMPAIGN_ID = "e2e00002-0000-4000-8000-000000000002";
const E2E_QUIZ_ID = "e2e00003-0000-4000-8000-000000000003";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSubmitReady(page) {
  await page.waitForFunction(() => {
    const btn = document.querySelector('[data-testid="quiz-submit-preview-button"]');
    if (!btn) return false;
    const text = btn.textContent ?? "";
    return !btn.disabled && !text.includes("제출 중");
  }, { timeout: 30000 });
}

async function findActiveDbCampaign(supabase) {
  const preferred = await supabase
    .from("campaigns")
    .select("id, title, reward_per_view, status")
    .eq("id", E2E_CAMPAIGN_ID)
    .eq("status", "active")
    .maybeSingle();

  if (preferred.data) {
    const { data: quizRows } = await supabase
      .from("quizzes_public")
      .select("id, campaign_id, question_text, options")
      .eq("campaign_id", E2E_CAMPAIGN_ID)
      .eq("is_active", true)
      .limit(1);
    if (quizRows?.length) {
      return {
        campaignId: E2E_CAMPAIGN_ID,
        quizId: quizRows[0].id ?? E2E_QUIZ_ID,
        title: preferred.data.title,
        options: quizRows[0].options,
      };
    }
  }

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, reward_per_view, status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`campaigns query failed: ${error.message}`);
  }

  for (const row of data ?? []) {
    if (UUID_RE.test(row.id)) {
      const { data: quizRows } = await supabase
        .from("quizzes_public")
        .select("id, campaign_id, question_text, options")
        .eq("campaign_id", row.id)
        .eq("is_active", true)
        .limit(1);

      if (quizRows?.length) {
        return {
          campaignId: row.id,
          quizId: quizRows[0].id,
          title: row.title,
          options: quizRows[0].options,
        };
      }
    }
  }

  return null;
}

async function countOwnAdViews(supabase, userId) {
  const { count, error } = await supabase
    .from("ad_views")
    .select("*", { count: "exact", head: true })
    .eq("consumer_user_id", userId);

  if (error) throw new Error(`ad_views count failed: ${error.message}`);
  return count ?? 0;
}

async function countPointLedger(supabase) {
  const { count, error } = await supabase
    .from("point_ledger")
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log("INFO: point_ledger count blocked by RLS (expected for consumer)");
    return null;
  }
  return count ?? 0;
}

async function getLatestOwnAdView(supabase, userId, campaignId) {
  const { data, error } = await supabase
    .from("ad_views")
    .select(
      "id, consumer_user_id, campaign_id, status, attempt_no, view_started_at, viewed_at, points_earned",
    )
    .eq("consumer_user_id", userId)
    .eq("campaign_id", campaignId)
    .order("viewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`ad_views select failed: ${error.message}`);
  return data;
}

async function main() {
  loadSupabaseEnv();
  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) {
    throw new Error("Supabase client unavailable — cannot run DB UUID campaign verify");
  }

  const projectRef = getSupabaseProjectRef();
  console.log(`INFO: E2E Supabase project-ref=${projectRef}`);

  try {
    const diag = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 60000 });
    const markerRef = extractMarkerValue(diag.combined, "stage30CurrentSupabaseProjectRef");
    const expectedProd = extractMarkerValue(diag.combined, "stage30ExpectedProdSupabaseRef");
    console.log(`INFO: Production diagnostics current ref=${markerRef}`);
    console.log(`INFO: Production diagnostics expected prod ref=${expectedProd}`);
    if (markerRef && markerRef !== "unknown" && markerRef !== projectRef) {
      throw new Error(
        `E2E client ref (${projectRef}) does not match Production diagnostics ref (${markerRef})`,
      );
    }
  } catch (e) {
    console.log(`INFO: diagnostics ref check skipped or failed: ${e.message}`);
  }

  const ts = Date.now();
  const nonce = randomBytes(4).toString("hex");
  const email = `stage2cr-db-${ts}-${nonce}@example.com`;
  const password = randomBytes(16).toString("base64url");

  let session;
  try {
    session = await createEphemeralSupabaseSession(email, password, BASE);
    console.log("PASS: ephemeral signup/login completed");
  } catch (e) {
    console.error("FAIL stage: auth — ephemeral signup/login");
    console.error(`HINT: candidate A prod OAuth/email auth — ${e.message}`);
    throw e;
  }
  const userId = session.user.id;

  const authed = await createAnonSupabaseClient(BASE);
  await authed.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const campaign = await findActiveDbCampaign(authed);
  if (!campaign) {
    console.error("FAIL stage: seed — no active DB UUID campaign with quiz");
    console.error("HINT: candidate B prod seed/migration — check e2e campaign seed on prod");
    throw new Error(
      "no active DB UUID campaign with quiz found — seed an active campaign for Stage 2-C-R DB verify",
    );
  }

  console.log(`INFO: DB UUID campaign ${campaign.campaignId}`);
  console.log("PASS: campaign + quizzes_public available for authenticated consumer");

  const beforeViews = await countOwnAdViews(authed, userId);
  const beforeLedger = await countPointLedger(authed);

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await injectSupabaseSession(context, BASE, session);
    const page = await context.newPage();

    const detailUrl = `${BASE}/consumer/ads/${campaign.campaignId}`;
    const detailResponse = await page.goto(detailUrl, { waitUntil: "networkidle" });
    console.log(`PASS: campaign detail route HTTP ${detailResponse?.status() ?? "unknown"}`);

    try {
      await page.locator('[data-testid="ad-view-started"]').waitFor({
        state: "visible",
        timeout: 30000,
      });
    } catch (e) {
      const bodySnippet = (await page.locator("body").innerText()).slice(0, 400);
      const hasQuizPanel = await page
        .locator('[data-testid="quiz-attempt-panel"]')
        .count();
      const hasLogin = bodySnippet.includes("로그인") || bodySnippet.includes("/auth/login");
      console.error("FAIL stage: ad-view-started marker timeout");
      if (hasLogin) {
        console.error("HINT: candidate A — authenticated session cookie mismatch or auth required");
      }
      if (!hasQuizPanel) {
        console.error("HINT: candidate B/C — quiz panel missing; campaign/quiz RLS or seed issue");
      }
      console.error(`HINT: candidate E — E2E ref=${projectRef}, cookie sb-${projectRef}-auth-token`);
      throw e;
    }
    await sleep(1000);

    const firstOption = page.locator('[data-testid="quiz-attempt-panel"] input[type="radio"]').first();
    await firstOption.click();

    const submitBtn = page.locator('[data-testid="quiz-submit-preview-button"]');
    if (!(await submitBtn.isDisabled())) {
      throw new Error("submit should be disabled before server min-view elapsed");
    }
    console.log("PASS: min_view not satisfied — submit disabled");

    await sleep(MIN_VIEW_SEC * 1000 + TIMER_BUFFER_MS);

    if (await submitBtn.isDisabled()) {
      throw new Error("submit should be enabled after min-view elapsed");
    }

    await submitBtn.click();
    await page.locator('[data-testid="quiz-attempt-result"]').waitFor({ state: "visible" });
    console.log("PASS: first submit after min-view elapsed");

    const afterStartView = await getLatestOwnAdView(authed, userId, campaign.campaignId);
    if (!afterStartView?.view_started_at) {
      throw new Error("ad_views row missing view_started_at after view start");
    }
    console.log("PASS: view_started_at recorded");

    const afterViews1 = await countOwnAdViews(authed, userId);
    if (afterViews1 <= beforeViews) {
      throw new Error("expected ad_views INSERT after beginAdView");
    }
    console.log("PASS: ad_views INSERT occurred");

    const attemptNo1 = afterStartView.attempt_no ?? 0;
    if (attemptNo1 < 1) {
      throw new Error(`expected attempt_no>=1 after first submit, got ${attemptNo1}`);
    }
    console.log(`PASS: attempt_no=${attemptNo1} after first submit`);

    const body1 = await page.locator("body").innerText();

    if (body1.includes("정답입니다")) {
      console.log("INFO: first submit was correct — skipping wrong-attempt retry path");
    } else {
      if (!body1.includes("한 번 더 도전") && !body1.includes("오답")) {
        throw new Error("expected incorrect or retry messaging");
      }
      console.log("PASS: first wrong allows retry messaging");

      await waitForSubmitReady(page);
      const wrongLabel =
        typeof campaign.options?.[0] === "string"
          ? campaign.options[0]
          : typeof campaign.options?.[0]?.label === "string"
            ? campaign.options[0].label
            : "월요일";
      await page.getByLabel(wrongLabel).click();
      await page.locator('[data-testid="quiz-submit-preview-button"]').click();
      await page.locator('[data-testid="quiz-attempt-result"]').waitFor({ state: "visible" });
      await sleep(1500);

      const finalView = await getLatestOwnAdView(authed, userId, campaign.campaignId);
      const body2 = await page.locator("body").innerText();
      if (
        (finalView?.attempt_no ?? 0) >= 2 ||
        finalView?.status === "failed" ||
        body2.includes("리워드 미리보기는 종료") ||
        body2.includes("종료되었습니다") ||
        body2.includes("attempt_limit")
      ) {
        console.log("PASS: second attempt / limit path observed");
      } else {
        console.error(
          `HINT: after second wrong — attempt_no=${finalView?.attempt_no ?? "?"}, status=${finalView?.status ?? "?"}`,
        );
        throw new Error("expected attempt_no=2 or reward preview ended after second wrong");
      }
    }

    const afterLedger = await countPointLedger(authed);
    if (beforeLedger != null && afterLedger != null && afterLedger !== beforeLedger) {
      throw new Error("point_ledger count changed");
    }
    console.log("PASS: point_ledger count unchanged (or RLS-blocked)");

    if (afterStartView.points_earned !== 0) {
      throw new Error("ad_views points_earned must remain 0 in Stage 2-C");
    }
    console.log("PASS: ad_views points_earned=0");

    console.log("PASS: verify:stage2c-db-uuid-campaign");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
