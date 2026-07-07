/**
 * Stage 2-A — quiz_answer / forbidden keys must not appear in client-visible artifacts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const BASE = resolveProductionE2eBaseUrl();

const FORBIDDEN_IN_RESPONSE = [
  "STAGE2A_SECRET_ANSWER_DO_NOT_EXPOSE",
  "quiz_answer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "isCorrect",
  "solution",
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

function scanConsumerAdsSource() {
  const scanDirs = [
    join(root, "src/lib/consumer-ads"),
    join(root, "src/components/consumer-ads"),
    join(root, "src/app/consumer/ads"),
  ];
  let failed = 0;

  for (const dir of scanDirs) {
    if (!statSync(dir, { throwIfNoEntry: false })) continue;
    for (const file of walk(dir)) {
      if (file.includes("stage2a-fixtures.server")) continue;
      if (file.includes("stage2b-preview.server")) continue;
      const content = readFileSync(file, "utf8");
      for (const key of FORBIDDEN_IN_RESPONSE) {
        if (key === "STAGE2A_SECRET_ANSWER_DO_NOT_EXPOSE") continue;
        if (content.includes(key)) {
          console.error(`FAIL: ${file} contains forbidden key "${key}"`);
          failed++;
        }
      }
    }
  }

  if (failed === 0) {
    console.log("PASS: consumer-ads source — no forbidden quiz answer keys");
  }
  return failed;
}

function scanFixtureServerOnly() {
  const fixture = readFileSync(
    join(root, "src/lib/consumer-ads/stage2a-fixtures.server.ts"),
    "utf8",
  );
  if (!fixture.includes("STAGE2A_SECRET_ANSWER_DO_NOT_EXPOSE")) {
    console.error("FAIL: server fixture missing sentinel (internal test only)");
    return 1;
  }
  if (!fixture.includes('import "server-only"')) {
    console.error("FAIL: fixture must import server-only");
    return 1;
  }
  console.log("PASS: sentinel exists server-only (not scanned as client exposure)");
  return 0;
}

async function scanProductionResponses() {
  const browser = await chromium.launch({ headless: true });
  let failed = 0;
  try {
    const page = await browser.newPage();
    const collected = [];

    page.on("response", async (res) => {
      const url = res.url();
      if (!url.includes(BASE.replace(/^https?:\/\//, "")) && !url.startsWith(BASE)) return;
      if (!url.includes("/consumer/ads")) return;
      try {
        const text = await res.text();
        collected.push({ url, text });
      } catch {
        // binary skip
      }
    });

    await page.goto(`${BASE}/consumer/ads`, { waitUntil: "networkidle" });
    const html = await page.content();
    collected.push({ url: "page-html", text: html });

    for (const { url, text } of collected) {
      for (const key of FORBIDDEN_IN_RESPONSE) {
        if (text.includes(key)) {
          console.error(`FAIL: "${key}" found in ${url}`);
          failed++;
        }
      }
    }

    if (failed === 0) {
      console.log("PASS: production /consumer/ads responses — no forbidden keys");
    }
  } finally {
    await browser.close();
  }
  return failed;
}

let failed = 0;
failed += scanFixtureServerOnly();
failed += scanConsumerAdsSource();
failed += await scanProductionResponses();

if (failed > 0) {
  console.error(`FAIL: verify:stage2a-no-quiz-answer-exposure (${failed} issues)`);
  process.exit(1);
}
console.log("PASS: verify:stage2a-no-quiz-answer-exposure");
