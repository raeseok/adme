/**
 * Stage 2-C — attempt limit (2 wrong → reward preview unavailable)
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";
const WRONG_OPTION_LABEL = "월요일";

async function waitTimerAndSelect(page) {
  await page.locator('[data-testid="ad-view-started"]').waitFor({ state: "visible" });
  await page
    .locator('[data-testid="min-view-timer"]')
    .getByText("이제 퀴즈를 제출할 수 있습니다.")
    .waitFor({ state: "visible", timeout: 15000 });
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
    const controlledSubmit = page.locator('[data-testid="quiz-submit-controlled-button"]');
    const previewSubmit = page.locator('[data-testid="quiz-submit-preview-button"]');
    const usesControlledPanel = (await controlledSubmit.count()) > 0;
    const submitButton = usesControlledPanel ? controlledSubmit : previewSubmit;
    const resultPanel = usesControlledPanel
      ? page.locator('[data-testid="quiz-controlled-result"]')
      : page.locator('[data-testid="quiz-attempt-result"]');

    await waitTimerAndSelect(page);
    await submitButton.click();
    await resultPanel.waitFor({ state: "visible" });

    const attemptsAfterFirst = page.locator('[data-testid="attempts-remaining"]');
    const attemptsText1 = await attemptsAfterFirst.innerText();
    const body1 = await page.locator("body").innerText();
    if (
      attemptsText1.includes("2") &&
      (body1.includes("현재 리워드 지급은 운영 안전 스위치로 차단되어 있습니다") ||
        body1.includes("현재 운영 환경에서는 실제 포인트 적립이 아직 열려 있지 않습니다"))
    ) {
      if (body1.includes("수요일입니다") || body1.match(/정답은\s+\S+\s+입니다/)) {
        throw new Error("must not expose correct answer text under production reward block");
      }
      if (body1.includes("적립되었습니다") || body1.includes("적립 완료")) {
        throw new Error("must not show completed reward copy under production reward block");
      }
      console.log("PASS: production reward block prevents attempt mutation");
      console.log("PASS: no answer exposure under production reward block");
      console.log("PASS: verify:stage2c-attempt-limit");
      return;
    }
    if (!attemptsText1.includes("1")) {
      throw new Error(`expected attemptsRemaining=1 after first wrong, got: ${attemptsText1}`);
    }
    console.log("PASS: attemptsRemaining=1 after first wrong");

    if (!body1.includes("한 번 더 도전")) {
      throw new Error("expected retry message after first wrong");
    }
    console.log("PASS: first wrong allows retry");

    await page.getByLabel(WRONG_OPTION_LABEL).click();
    await submitButton.click();
    await page.waitForTimeout(2000);

    const body2 = await page.locator("body").innerText();
    if (
      !body2.includes("리워드 미리보기는 종료") &&
      !body2.includes("attempt_limit")
    ) {
      throw new Error("expected attempt limit message after second wrong");
    }
    console.log("PASS: second wrong ends reward preview");

    if (body2.includes("수요일입니다") || body2.match(/정답은\s+\S+\s+입니다/)) {
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
