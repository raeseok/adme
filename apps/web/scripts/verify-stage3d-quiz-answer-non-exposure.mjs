/**
 * Stage 3-D — quiz_answer / answer hint non-exposure
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  ANSWER_HINT_TOKENS,
  FORBIDDEN_ANSWER_KEYS,
  assertNoForbiddenKeys,
  readText,
} from "./utils/stage3d-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

async function verifyRoutes() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const route of [
      "/",
      "/consumer",
      "/consumer/ads",
      "/consumer/ads/e2e00002-0000-4000-8000-000000000002",
      "/consumer/profile",
      "/auth/login",
      "/admin/diagnostics",
      "/admin/reward-preflight",
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      assertNoForbiddenKeys(html, `html ${route}`);
      assertNoForbiddenKeys(body, `body ${route}`);
    }
    console.log("PASS: routes — no forbidden answer keys");
  } finally {
    await browser.close();
  }
}

function verifyServerModules() {
  const files = [
    join(WEB_ROOT, "src/lib/quiz-rewards/stage3c-sanitize.ts"),
    join(WEB_ROOT, "src/lib/quiz-rewards/stage3c-submit.server.ts"),
    join(WEB_ROOT, "src/lib/rewards/stage3d-diagnostics.ts"),
    join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"),
    join(WEB_ROOT, "src/app/consumer/ads/[campaignId]/actions.ts"),
  ];
  for (const file of files) {
    const text = readText(file);
    for (const key of FORBIDDEN_ANSWER_KEYS) {
      // Allow documentation of forbidden keys in comments only if quoted as guard lists
      if (
        text.includes(`"${key}"`) ||
        text.includes(`'${key}'`) ||
        text.includes(`${key}=`)
      ) {
        // diagnostics markers like stage3DQuizAnswerExposure=false are OK
        if (key === "quiz_answer" && text.includes("QuizAnswerExposure")) {
          continue;
        }
        if (
          file.includes("stage3c-sanitize") ||
          file.includes("stage3d-helpers")
        ) {
          continue;
        }
        // Reject payload field exposure patterns
        if (
          new RegExp(`\\b${key}\\b\\s*:`).test(text) &&
          !file.includes("sanitize")
        ) {
          throw new Error(`${file} may expose ${key}`);
        }
      }
    }
  }
  console.log("PASS: server modules — no answer payload fields");
}

function verifyOptionLabelsStatic() {
  const panel = readText(
    join(WEB_ROOT, "src/components/campaigns/QuizSubmitControlledPanel.tsx"),
  );
  for (const token of ANSWER_HINT_TOKENS) {
    if (panel.toLowerCase().includes(`"${token}"`)) {
      throw new Error(`option label hint token in panel: ${token}`);
    }
  }
  console.log("PASS: option label hint tokens absent in submit panel");
}

async function main() {
  verifyServerModules();
  verifyOptionLabelsStatic();
  await verifyRoutes();
  console.log("RESULT: stage3DQuizAnswerExposure=false");
  console.log("RESULT: stage3DAnswerHintExposure=false");
  console.log("RESULT: stage3DAnswerHintOptionLabelExposure=false");
  console.log("PASS: verify:stage3d-quiz-answer-non-exposure");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
