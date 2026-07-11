/**
 * Stage 2-B — server grading preview must not expose quiz answer keys or text
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";
const SECRET_SENTINEL = "STAGE2A_SECRET_ANSWER_DO_NOT_EXPOSE";

const FORBIDDEN_KEYS = [
  "quiz_answer",
  "quizAnswer",
  "correctAnswer",
  "correct_answer",
  "correctOption",
  "correct_option",
  "correctIndex",
  "correct_index",
  "answerIndex",
  "answer_index",
  "solution",
  "answer",
];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function scanJsonForForbiddenKeys(jsonText, source, failedRef) {
  try {
    const parsed = JSON.parse(jsonText);
    const stack = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) {
          if (FORBIDDEN_KEYS.includes(key)) {
            console.error(`FAIL: forbidden key "${key}" in ${source}`);
            failedRef.count++;
          }
          if (key === "correct" && typeof value === "boolean") {
            console.error(`FAIL: forbidden boolean key "correct" in ${source}`);
            failedRef.count++;
          }
          if (value && typeof value === "object") stack.push(value);
        }
      }
    }
  } catch {
    for (const key of FORBIDDEN_KEYS) {
      if (jsonText.includes(`"${key}"`)) {
        console.error(`FAIL: "${key}" string in non-JSON ${source}`);
        failedRef.count++;
      }
    }
  }
}

function scanStage2BSource() {
  const scanDirs = [
    join(root, "src/lib/consumer-ads"),
    join(root, "src/components/campaigns"),
    join(root, "src/app/consumer/ads"),
  ];
  let failed = 0;

  for (const dir of scanDirs) {
    if (!statSync(dir, { throwIfNoEntry: false })) continue;
    for (const file of walk(dir)) {
      if (file.includes("stage2a-fixtures.server")) continue;
      if (file.includes("stage2b-preview.server")) continue;
      if (file.includes("stage2c-ad-views.server")) continue;
      const content = readFileSync(file, "utf8");
      for (const key of FORBIDDEN_KEYS) {
        if (content.includes(`"${key}"`) || content.includes(`${key}:`)) {
          if (file.includes("verify-stage2b")) continue;
          console.error(`FAIL: ${file} contains forbidden key "${key}"`);
          failed++;
        }
      }
    }
  }

  if (failed === 0) {
    console.log("PASS: Stage 2-B source — no forbidden quiz answer keys in client paths");
  }
  return failed;
}

async function collectSafeDiagnostics(page, label) {
  const screenshotPath = join(tmpdir(), `adme-stage2b-quiz-guard-${Date.now()}.png`);
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const dataTestIds = await page
    .locator("[data-testid]")
    .evaluateAll((nodes) =>
      nodes
        .map((node) => node.getAttribute("data-testid"))
        .filter((value) => typeof value === "string" && value.length > 0)
        .slice(0, 80),
    )
    .catch(() => []);
  const diagnostics = {
    label,
    url: page.url(),
    pathname: new URL(page.url()).pathname,
    title: await page.title().catch(() => ""),
    previewPanelCount: await page.locator('[data-testid="quiz-submit-preview-panel"]').count(),
    previewPanelVisible: await page
      .locator('[data-testid="quiz-submit-preview-panel"]')
      .first()
      .isVisible()
      .catch(() => false),
    controlledPanelCount: await page.locator('[data-testid="quiz-submit-controlled-panel"]').count(),
    controlledPanelVisible: await page
      .locator('[data-testid="quiz-submit-controlled-panel"]')
      .first()
      .isVisible()
      .catch(() => false),
    previewRadioCount: await page
      .locator('[data-testid="quiz-submit-preview-panel"] input[type="radio"]')
      .count(),
    controlledRadioCount: await page
      .locator('[data-testid="quiz-submit-controlled-panel"] input[type="radio"]')
      .count(),
    pageRadioCount: await page.locator('input[type="radio"]').count(),
    roleRadioCount: await page.getByRole("radio").count().catch(() => 0),
    buttonCount: await page.locator("button").count(),
    labelCount: await page.locator("label").count(),
    previewSubmitCount: await page.locator('[data-testid="quiz-submit-preview-button"]').count(),
    controlledSubmitCount: await page.locator('[data-testid="quiz-submit-controlled-button"]').count(),
    adViewStartedCount: await page.locator('[data-testid="ad-view-started"]').count(),
    minViewTimerCount: await page.locator('[data-testid="min-view-timer"]').count(),
    visibleTextSnippet: bodyText.replace(/\s+/g, " ").slice(0, 700),
    dataTestIds,
    screenshotPath,
  };
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
  console.log(`DIAG: ${JSON.stringify(diagnostics, null, 2)}`);
}

async function scanProductionSubmit() {
  const browser = await chromium.launch({ headless: true });
  const failedRef = { count: 0 };
  try {
    const page = await browser.newPage();
    const collected = [];
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text().slice(0, 300));
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(String(error.message ?? error).slice(0, 300));
    });
    page.on("requestfailed", (request) => {
      const url = new URL(request.url());
      requestFailures.push({
        path: url.pathname,
        failure: request.failure()?.errorText?.slice(0, 160) ?? "unknown",
      });
    });

    page.on("response", async (res) => {
      const url = res.url();
      if (!url.startsWith(BASE)) return;
      try {
        const text = await res.text();
        collected.push({ url, text });
      } catch {
        // skip binary
      }
    });

    await page.goto(`${BASE}/consumer/ads/${FIXTURE_CAMPAIGN}`, {
      waitUntil: "networkidle",
    });

    const previewPanel = page.locator('[data-testid="quiz-submit-preview-panel"]');
    const controlledPanel = page.locator('[data-testid="quiz-submit-controlled-panel"]');
    const panel =
      (await controlledPanel.count()) > 0 ? controlledPanel : previewPanel;
    const submitButton =
      (await controlledPanel.count()) > 0
        ? page.locator('[data-testid="quiz-submit-controlled-button"]')
        : page.locator('[data-testid="quiz-submit-preview-button"]');
    const resultPanel =
      (await controlledPanel.count()) > 0
        ? page.locator('[data-testid="quiz-controlled-result"]')
        : page.locator('[data-testid="quiz-preview-result"]');

    await panel.waitFor({ state: "visible", timeout: 15000 });
    await page.locator('[data-testid="ad-view-started"]').waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.locator('[data-testid="min-view-timer"]').waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page
      .locator('[data-testid="min-view-timer"]')
      .getByText("이제 퀴즈를 제출할 수 있습니다.")
      .waitFor({ state: "visible", timeout: 15000 });

    if ((await panel.getByRole("radio").count()) === 0) {
      await collectSafeDiagnostics(page, "before quiz radio click");
      console.log(`DIAG: consoleErrors=${JSON.stringify(consoleErrors.slice(0, 10))}`);
      console.log(`DIAG: pageErrors=${JSON.stringify(pageErrors.slice(0, 10))}`);
      console.log(`DIAG: requestFailures=${JSON.stringify(requestFailures.slice(0, 10))}`);
      throw new Error("quiz radio control not found");
    }
    await panel.getByRole("radio").first().click();
    await submitButton.waitFor({ state: "visible", timeout: 15000 });
    await submitButton.evaluate((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("quiz submit target is not a button");
      }
      if (button.disabled) {
        throw new Error("quiz submit button is disabled after timer and selection");
      }
    });
    await submitButton.click();
    await resultPanel.waitFor({ state: "visible", timeout: 15000 });

    const html = await page.content();
    collected.push({ url: "page-html-after-submit", text: html });

    for (const { url, text } of collected) {
      if (text.includes(SECRET_SENTINEL)) {
        console.error(`FAIL: secret sentinel in ${url}`);
        failedRef.count++;
      }
      scanJsonForForbiddenKeys(text, url, failedRef);
    }

    const body = await page.locator("body").innerText();
    if (body.includes(SECRET_SENTINEL)) {
      console.error("FAIL: secret sentinel in visible body");
      failedRef.count++;
    }

    if (failedRef.count === 0) {
      console.log("PASS: production submit — no forbidden keys or secret sentinel");
    }
  } finally {
    await browser.close();
  }
  return failedRef.count;
}

let failed = 0;
failed += scanStage2BSource();
failed += await scanProductionSubmit();

if (failed > 0) {
  console.error(`FAIL: verify:stage2b-server-grading-no-answer-exposure (${failed} issues)`);
  process.exit(1);
}
console.log("PASS: verify:stage2b-server-grading-no-answer-exposure");
