/**
 * Stage 2-C — attempt limit (2 wrong → reward preview unavailable)
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";
const WRONG_OPTION_LABEL = "월요일";
const TIMER_WAIT_MS = 6500;

async function waitTimerAndSelect(page) {
  await page.locator('[data-testid="ad-view-started"]').waitFor({ state: "visible" });
  await page.waitForTimeout(TIMER_WAIT_MS);
  await page.getByLabel(WRONG_OPTION_LABEL).click();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.clearCookies();
    const page = await context.newPage();

    await page.goto(`${BASE}/consumer/ads/${FIXTURE_CAMPAIGN}`, {
      waitUntil: "networkidle",
    });

    await waitTimerAndSelect(page);
    await page.locator('[data-testid="quiz-submit-preview-button"]').click();
    await page.locator('[data-testid="quiz-attempt-result"]').waitFor({ state: "visible" });

    const attemptsAfterFirst = page.locator('[data-testid="attempts-remaining"]');
    const attemptsText1 = await attemptsAfterFirst.innerText();
    if (!attemptsText1.includes("1")) {
      throw new Error(`expected attemptsRemaining=1 after first wrong, got: ${attemptsText1}`);
    }
    console.log("PASS: attemptsRemaining=1 after first wrong");

    const body1 = await page.locator("body").innerText();
    if (!body1.includes("한 번 더 도전")) {
      throw new Error("expected retry message after first wrong");
    }
    console.log("PASS: first wrong allows retry");

    await page.getByLabel(WRONG_OPTION_LABEL).click();
    await page.locator('[data-testid="quiz-submit-preview-button"]').click();
    await page.waitForTimeout(2000);

    const body2 = await page.locator("body").innerText();
    if (
      !body2.includes("리워드 미리보기는 종료") &&
      !body2.includes("attempt_limit")
    ) {
      throw new Error("expected attempt limit message after second wrong");
    }
    console.log("PASS: second wrong ends reward preview");

    if (body2.includes("정답은") && body2.includes("입니다")) {
      throw new Error("must not expose correct answer text");
    }
    console.log("PASS: no answer exposure on wrong attempts");

    console.log("PASS: verify:stage2c-attempt-limit");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
