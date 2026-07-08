/**
 * Stage 3-C preflight — answer-hint option label guard (blocker before UI integration)
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KNOWN_DEV_SUPABASE_REF } from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3C_PUBLIC_FORBIDDEN_MARKERS,
  assertNoAnswerHintInLabel,
  assertNoForbiddenKeys,
} from "./utils/stage3c-helpers.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BASE = resolveProductionE2eBaseUrl();
const DEV_REF = KNOWN_DEV_SUPABASE_REF;

function loadDevAnonEnv() {
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${DEV_REF} -o json`,
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find(
    (k) => k.id === "anon" && typeof k.api_key === "string" && k.api_key.startsWith("eyJ"),
  );
  if (!anon?.api_key) {
    throw new Error("dev anon key not found");
  }
  return { url: `https://${DEV_REF}.supabase.co`, key: anon.api_key };
}

function scanQuizOptions(options, quizId) {
  if (!Array.isArray(options)) return;
  for (const [index, item] of options.entries()) {
    let label = null;
    if (typeof item === "string") label = item;
    if (item && typeof item === "object") {
      label =
        typeof item.label === "string"
          ? item.label
          : typeof item.text === "string"
            ? item.text
            : null;
    }
    if (label) {
      assertNoAnswerHintInLabel(label, `quizzes_public quiz=${quizId} option[${index}]`);
    }
  }
}

async function verifyDevQuizzesPublic() {
  const env = loadDevAnonEnv();
  const supabase = createClient(env.url, env.key);
  const { data, error } = await supabase
    .from("quizzes_public")
    .select("id, campaign_id, options")
    .limit(200);
  if (error) {
    throw new Error(`quizzes_public read failed: ${error.message}`);
  }

  for (const row of data ?? []) {
    const payload = JSON.stringify(row);
    assertNoForbiddenKeys(payload, `quizzes_public row ${row.id}`);
    scanQuizOptions(row.options, row.id);
  }
  console.log("PASS: dev quizzes_public — no answer keys or hint labels");
}

async function verifyPublicHtml() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const route of ["/consumer/ads", "/consumer/ads/e2e00002-0000-4000-8000-000000000002"]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      assertNoForbiddenKeys(html, `html ${route}`);

      const quizPanel = page.locator(
        '[data-testid="quiz-submit-controlled-panel"], [data-testid="quiz-submit-preview-panel"]',
      );
      if ((await quizPanel.count()) > 0) {
        const optionLabels = await quizPanel.locator("label span").allTextContents();
        for (const label of optionLabels) {
          assertNoAnswerHintInLabel(label, `ui option ${route}`);
        }
      }

      for (const marker of STAGE3C_PUBLIC_FORBIDDEN_MARKERS) {
        const body = await page.locator("body").innerText();
        if (html.includes(marker) || body.includes(marker)) {
          throw new Error(`public route ${route} exposes stage3C marker ${marker}`);
        }
      }
    }
    console.log("PASS: public consumer ads HTML — no answer exposure or stage3C markers");
  } finally {
    await browser.close();
  }
}

async function main() {
  await verifyDevQuizzesPublic();
  await verifyPublicHtml();
  console.log("PASS: verify:stage3c-preflight-answer-hint-guard");
  console.log("RESULT: answerHintOptionLabelExposure=false");
  console.log("RESULT: quizAnswerExposure=false");
  console.log("RESULT: publicMarkerExposed=false");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
