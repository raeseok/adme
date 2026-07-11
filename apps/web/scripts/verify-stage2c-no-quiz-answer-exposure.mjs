/**
 * Stage 2-C — no quiz answer exposure in server action / HTML / network
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
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
    const st = statSync(full, { throwIfNoEntry: false });
    if (!st) continue;
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

function scanStage2CSource() {
  const scanDirs = [
    join(root, "src/lib/consumer-ads/stage2c-ad-views.server.ts"),
    join(root, "src/lib/consumer-ads/stage2c-fixture-views.server.ts"),
    join(root, "src/components/campaigns"),
    join(root, "src/app/consumer/ads"),
  ];
  let failed = 0;

  for (const target of scanDirs) {
    const files = statSync(target).isDirectory() ? walk(target) : [target];
    for (const file of files) {
      if (file.includes("stage2a-fixtures.server")) continue;
      if (file.includes("stage2c-ad-views.server")) continue;
      const content = readFileSync(file, "utf8");
      for (const key of FORBIDDEN_KEYS) {
        if (content.includes(`"${key}"`) || content.includes(`${key}:`)) {
          if (file.includes("verify-stage2c")) continue;
          console.error(`FAIL: ${file} contains forbidden key "${key}"`);
          failed++;
        }
      }
    }
  }

  if (failed === 0) {
    console.log("PASS: Stage 2-C source — no forbidden quiz answer keys in client paths");
  }
  return failed;
}

async function scanProductionSubmit() {
  const browser = await chromium.launch({ headless: true });
  const failedRef = { count: 0 };
  try {
    const page = await browser.newPage();
    const collected = [];

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

    const controlledPanel = page.locator('[data-testid="quiz-submit-controlled-panel"]');
    const attemptPanel = page.locator('[data-testid="quiz-attempt-panel"]');
    const panel =
      (await controlledPanel.count()) > 0 ? controlledPanel : attemptPanel;
    const submitButton =
      (await controlledPanel.count()) > 0
        ? page.locator('[data-testid="quiz-submit-controlled-button"]')
        : page.locator('[data-testid="quiz-submit-preview-button"]');
    const resultPanel =
      (await controlledPanel.count()) > 0
        ? page.locator('[data-testid="quiz-controlled-result"]')
        : page.locator('[data-testid="quiz-attempt-result"]');

    await panel.waitFor({ state: "visible", timeout: 15000 });
    await page
      .locator('[data-testid="min-view-timer"]')
      .getByText("이제 퀴즈를 제출할 수 있습니다.")
      .waitFor({ state: "visible", timeout: 15000 });
    await panel.getByRole("radio").first().click();
    await submitButton.waitFor({ state: "visible", timeout: 15000 });
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
failed += scanStage2CSource();
failed += await scanProductionSubmit();

if (failed > 0) {
  console.error(`FAIL: verify:stage2c-no-quiz-answer-exposure (${failed} issues)`);
  process.exit(1);
}
console.log("PASS: verify:stage2c-no-quiz-answer-exposure");
