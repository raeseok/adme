/**
 * Stage 2-B — Production/local smoke: min-view timer + quiz submit preview
 */
import { chromium, devices } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";
const TIMER_BUFFER_MS = 1500;

function assertVisible(locator, label) {
  return locator.waitFor({ state: "visible", timeout: 15000 }).then(() => {
    console.log(`PASS: ${label} — visible`);
  });
}

async function runFlow(page, label) {
  const detailUrl = `${BASE}/consumer/ads/${FIXTURE_CAMPAIGN}`;
  const res = await page.goto(detailUrl, { waitUntil: "networkidle" });
  if (!res || res.status() !== 200) {
    throw new Error(`${label}: detail HTTP ${res?.status() ?? "error"}`);
  }
  console.log(`PASS: ${label} — detail HTTP 200`);

  const viewStarted = page.locator('[data-testid="ad-view-started"]');
  await assertVisible(viewStarted, `${label} ad-view-started`);

  const timer = page.locator('[data-testid="min-view-timer"]');
  await assertVisible(timer, `${label} min-view timer`);

  const bodyBefore = await page.locator("body").innerText();
  if (!bodyBefore.includes("광고 내용을") || !bodyBefore.includes("퀴즈 제출까지")) {
    throw new Error(`${label}: missing timer copy`);
  }
  console.log(`PASS: ${label} — timer copy present`);

  const controlledPanel = page.locator('[data-testid="quiz-submit-controlled-panel"]');
  const previewPanel = page.locator('[data-testid="quiz-submit-preview-panel"]');
  const panel =
    (await controlledPanel.count()) > 0 ? controlledPanel : previewPanel;
  const submitBtn =
    (await controlledPanel.count()) > 0
      ? page.locator('[data-testid="quiz-submit-controlled-button"]')
      : page.locator('[data-testid="quiz-submit-preview-button"]');
  const result =
    (await controlledPanel.count()) > 0
      ? page.locator('[data-testid="quiz-controlled-result"]')
      : page.locator('[data-testid="quiz-preview-result"]');
  await assertVisible(submitBtn, `${label} submit button`);

  if (!(await submitBtn.isDisabled())) {
    throw new Error(`${label}: submit should be disabled before timer completes`);
  }
  console.log(`PASS: ${label} — submit disabled before timer`);

  const firstRadio = panel.getByRole("radio").first();
  await firstRadio.click();
  if (!(await submitBtn.isDisabled())) {
    throw new Error(`${label}: submit should stay disabled before timer even with selection`);
  }
  console.log(`PASS: ${label} — submit disabled with selection before timer`);

  const requiredSeconds = 5;
  await page.waitForTimeout(requiredSeconds * 1000 + TIMER_BUFFER_MS);

  const bodyAfterTimer = await page.locator("body").innerText();
  if (!bodyAfterTimer.includes("이제 퀴즈를 제출할 수 있습니다.")) {
    throw new Error(`${label}: missing timer complete copy`);
  }
  console.log(`PASS: ${label} — timer complete copy`);

  if (await submitBtn.isDisabled()) {
    throw new Error(`${label}: submit should be enabled after timer + selection`);
  }
  console.log(`PASS: ${label} — submit enabled after timer`);

  await submitBtn.click();

  await assertVisible(result, `${label} preview result`);

  const resultText = await result.innerText();
  const hasVerdict =
    resultText.includes("정답입니다") ||
    resultText.includes("오답입니다") ||
    resultText.includes("현재 운영 환경에서는 실제 포인트 적립이 아직 열려 있지 않습니다") ||
    resultText.includes("현재 운영 환경에서는 리워드 지급이 아직 열려 있지 않습니다") ||
    resultText.includes("현재 리워드 지급은 운영 안전 스위치로 차단되어 있습니다");
  if (!hasVerdict) {
    throw new Error(`${label}: expected supported quiz result, got: ${resultText}`);
  }
  console.log(`PASS: ${label} — verdict shown`);

  if (resultText.includes("적립되었습니다") || resultText.includes("적립 완료")) {
    throw new Error(`${label}: must not show completed reward copy`);
  }
  console.log(`PASS: ${label} — no completed reward copy`);

  console.log(`PASS: ${label} flow complete`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [label, viewport] of [
      ["mobile-390", devices["Pixel 5"].viewport],
      ["desktop-1440", { width: 1440, height: 900 }],
    ]) {
      const page = await browser.newPage({ viewport });
      await runFlow(page, label);
      await page.close();
    }
    console.log("PASS: smoke:stage2b-min-view-timer");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
