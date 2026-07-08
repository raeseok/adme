/**
 * Stage 3-C — quiz_answer and answer keys must not appear in HTML, diagnostics, or DTOs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  FORBIDDEN_ANSWER_KEYS,
  assertNoForbiddenKeys,
  readText,
} from "./utils/stage3c-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

async function verifyPublicRoutes() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const route of [
      "/consumer/ads",
      "/consumer/ads/e2e00002-0000-4000-8000-000000000002",
      "/consumer",
      "/",
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      assertNoForbiddenKeys(html, `html ${route}`);
      assertNoForbiddenKeys(body, `body ${route}`);
    }
    console.log("PASS: public routes — no forbidden answer keys");
  } finally {
    await browser.close();
  }
}

async function verifyDiagnostics() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const body = await page.locator("body").innerText();
    assertNoForbiddenKeys(body, "diagnostics body");
    console.log("PASS: diagnostics — no forbidden answer keys");
  } finally {
    await browser.close();
  }
}

function verifyServerModules() {
  const files = [
    join(WEB_ROOT, "src", "lib", "quiz-rewards", "stage3c-types.ts"),
    join(WEB_ROOT, "src", "lib", "quiz-rewards", "stage3c-sanitize.ts"),
    join(WEB_ROOT, "src", "lib", "quiz-rewards", "stage3c-submit.server.ts"),
    join(WEB_ROOT, "src", "app", "consumer", "ads", "[campaignId]", "actions.ts"),
  ];
  for (const file of files) {
    const text = readText(file);
    for (const key of FORBIDDEN_ANSWER_KEYS) {
      if (text.includes(key) && !file.includes("stage3c-sanitize")) {
        throw new Error(`server module ${file} references forbidden key ${key}`);
      }
    }
  }
  console.log("PASS: server modules — sanitize layer present");
}

async function main() {
  verifyServerModules();
  await verifyPublicRoutes();
  await verifyDiagnostics();
  console.log("RESULT: quiz_answer exposure=false");
  console.log("PASS: verify:stage3c-quiz-answer-non-exposure");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
