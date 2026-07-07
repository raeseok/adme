/**
 * Stage 2-A — stage2A machine markers only on /admin/diagnostics, not public routes
 */
import { chromium } from "playwright";

const BASE = process.env.ADME_E2E_BASE_URL ?? "https://web-ashen-xi-52.vercel.app";

const PUBLIC_FORBIDDEN = [
  "stage2ABuild=",
  "stage2AReadOnlyMode=",
  "stage2APointLedgerMutation=",
  "stage2AQuizAnswerClientExposure=",
  "stage2AServiceRoleUsed=",
  "stage2AAdViewsMutation=",
  "stage2AConsumerAdRoute=",
  "stage2AQuizSubmitEnabled=",
  "stage2ARewardPreviewOnly=",
  "stage2AKakaoNotificationActualSend=",
  "stage2AKakaoApiIntegrated=",
  "stage2AKakaoFeasibilityDocumented=",
  "stage2AKakaoFutureStage=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage2ABuild=stage2a-readonly-ad-card-quiz-kakao-feasibility-production",
  "stage2AReadOnlyMode=true",
  "stage2APointLedgerMutation=false",
  "stage2AQuizAnswerClientExposure=false",
  "stage2AServiceRoleUsed=false",
  "stage2AAdViewsMutation=false",
  "stage2AConsumerAdRoute=/consumer/ads",
  "stage2AQuizSubmitEnabled=false",
  "stage2ARewardPreviewOnly=true",
  "stage2AKakaoNotificationActualSend=false",
  "stage2AKakaoApiIntegrated=false",
  "stage2AKakaoFeasibilityDocumented=true",
  "stage2AKakaoFutureStage=Stage 2-D / Stage 5-K",
];

function assertNotContains(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: should not contain "${needle}"`);
  }
  console.log(`PASS: ${label} — no "${needle}"`);
}

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    for (const route of ["/", "/consumer", "/consumer/ads"]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const body = await page.locator("body").innerText();
      for (const marker of PUBLIC_FORBIDDEN) {
        assertNotContains(body, marker, `public ${route}`);
      }
    }

    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const diag = await page.locator("body").innerText();
    for (const marker of DIAGNOSTICS_REQUIRED) {
      assertContains(diag, marker, "diagnostics");
    }

    console.log("PASS: verify:stage2a-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
