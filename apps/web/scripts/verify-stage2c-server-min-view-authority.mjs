/**
 * Stage 2-C — server authoritative min-view rejects early submit
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";
const MIN_VIEW_SEC = 5;
const BUFFER_MS = 1500;

const stage2cServer = readFileSync(
  join(root, "src/lib/consumer-ads/stage2c-ad-views.server.ts"),
  "utf8",
);
const stage2cActions = readFileSync(
  join(root, "src/app/consumer/ads/[campaignId]/actions.ts"),
  "utf8",
);

if (stage2cServer.includes("clientElapsedMs")) {
  console.error("FAIL: stage2c server must not use clientElapsedMs");
  process.exit(1);
}
console.log("PASS: stage2c server ignores clientElapsedMs");

const attemptFn = stage2cActions.match(
  /export async function submitQuizAttemptAction\([\s\S]*?\n\}/,
)?.[0];
if (attemptFn?.includes("clientElapsedMs")) {
  console.error("FAIL: submitQuizAttemptAction must not accept clientElapsedMs");
  process.exit(1);
}
console.log("PASS: submitQuizAttemptAction has no clientElapsedMs input");

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.clearCookies();
    const page = await context.newPage();

    await page.goto(`${BASE}/consumer/ads/${FIXTURE_CAMPAIGN}`, {
      waitUntil: "networkidle",
    });

    await page.locator('[data-testid="ad-view-started"]').waitFor({ state: "visible" });
    console.log("PASS: view session started");

    await page.waitForTimeout(1000);

    const controlledPanel = page.locator('[data-testid="quiz-submit-controlled-panel"]');
    const attemptPanel = page.locator('[data-testid="quiz-attempt-panel"]');
    const panel =
      (await controlledPanel.count()) > 0 ? controlledPanel : attemptPanel;
    const submitBtn =
      (await controlledPanel.count()) > 0
        ? page.locator('[data-testid="quiz-submit-controlled-button"]')
        : page.locator('[data-testid="quiz-submit-preview-button"]');
    const resultPanel =
      (await controlledPanel.count()) > 0
        ? page.locator('[data-testid="quiz-controlled-result"]')
        : page.locator('[data-testid="quiz-attempt-result"]');
    await panel.getByRole("radio").first().click();

    if (!(await submitBtn.isDisabled())) {
      throw new Error("submit should be disabled before min-view satisfied");
    }
    console.log("PASS: early submit blocked in UI before server min-view");

    await page.waitForTimeout(MIN_VIEW_SEC * 1000 + BUFFER_MS);

    const body = await page.locator("body").innerText();
    if (!body.includes("이제 퀴즈를 제출할 수 있습니다.")) {
      throw new Error("timer should complete after server min-view elapsed");
    }

    if (await submitBtn.isDisabled()) {
      throw new Error("submit should be enabled after server min-view elapsed");
    }

    await submitBtn.click();
    await resultPanel.waitFor({
      state: "visible",
      timeout: 15000,
    });
    console.log("PASS: submit allowed after server min-view elapsed");

    console.log("PASS: verify:stage2c-server-min-view-authority");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
