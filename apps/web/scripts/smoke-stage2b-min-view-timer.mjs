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

  const timer = page.locator('[data-testid="min-view-timer"]');
  await assertVisible(timer, `${label} min-view timer`);

  const bodyBefore = await page.locator("body").innerText();
  if (!bodyBefore.includes("광고 내용을") || !bodyBefore.includes("남은 시간:")) {
    throw new Error(`${label}: missing timer copy`);
  }
  console.log(`PASS: ${label} — timer copy present`);

  const submitBtn = page.locator('[data-testid="quiz-submit-preview-button"]');
  await assertVisible(submitBtn, `${label} submit button`);

  if (!(await submitBtn.isDisabled())) {
    throw new Error(`${label}: submit should be disabled before timer completes`);
  }
  console.log(`PASS: ${label} — submit disabled before timer`);

  const panel = page.locator('[data-testid="quiz-submit-preview-panel"]');
  const firstRadio = panel.locator('input[type="radio"]').first();
  await firstRadio.click();
  if (!(await submitBtn.isDisabled())) {
    throw new Error(`${label}: submit should stay disabled before timer even with selection`);
  }
  console.log(`PASS: ${label} — submit disabled with selection before timer`);

  const requiredSeconds = 5;
  await page.waitForTimeout(requiredSeconds * 1000 + TIMER_BUFFER_MS);

  const bodyAfterTimer = await page.locator("body").innerText();
  if (!bodyAfterTimer.includes("최소 열람 시간이 완료되었습니다")) {
    throw new Error(`${label}: missing timer complete copy`);
  }
  console.log(`PASS: ${label} — timer complete copy`);

  if (await submitBtn.isDisabled()) {
    throw new Error(`${label}: submit should be enabled after timer + selection`);
  }
  console.log(`PASS: ${label} — submit enabled after timer`);

  await submitBtn.click();

  const result = page.locator('[data-testid="quiz-preview-result"]');
  await assertVisible(result, `${label} preview result`);

  const resultText = await result.innerText();
  const hasVerdict =
    resultText.includes("정답입니다") || resultText.includes("오답입니다");
  if (!hasVerdict) {
    throw new Error(`${label}: expected correct/incorrect verdict in result`);
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
