/**
 * Stage 3-D — Kakao secret / OAuth code-token redaction guard
 * Never logs secrets, codes, or tokens.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  assertContains,
  assertNotContains,
  readText,
  SECRET_EXPOSURE_PATTERNS,
} from "./utils/stage3d-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

function verifyAttestationSource() {
  const attestation = readText(
    join(WEB_ROOT, "src/lib/rewards/kakao-secret-attestation.ts"),
  );
  const diagnostics = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3d-diagnostics.ts"),
  );
  const preflightPage = readText(
    join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"),
  );

  if (!attestation.includes('import "server-only"')) {
    throw new Error("kakao attestation must be server-only");
  }
  for (const bad of [
    "createHash",
    "digest(",
    "client_secret",
    "CLIENT_SECRET",
    "access_token",
    "authorization_code",
  ]) {
    if (attestation.includes(bad)) {
      throw new Error(`attestation must not reference ${bad}`);
    }
  }
  console.log("PASS: attestation source has no secret material APIs");

  assertContains(
    diagnostics,
    "stage3DKakaoSecretRawExposed: false",
    "diagnostics type",
  );
  assertContains(
    diagnostics,
    "stage3DOAuthCodeTokenExposed: false",
    "diagnostics oauth type",
  );
  assertContains(
    diagnostics,
    "stage3DKakaoSecretRawRecorded",
    "diagnostics raw recorded field",
  );
  assertContains(
    diagnostics,
    "stage3DKakaoSecretPartialHashDigestRecorded",
    "diagnostics partial/hash/digest field",
  );

  for (const pattern of SECRET_EXPOSURE_PATTERNS) {
    assertNotContains(preflightPage, pattern, "reward-preflight page");
  }
  console.log("PASS: reward-preflight page has no secret display patterns");
}

async function verifyProductionUi() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    for (const route of [
      "/admin/diagnostics",
      "/admin/reward-preflight",
      "/auth/login",
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const body = await page.locator("body").innerText();
      const html = await page.content();
      for (const pattern of SECRET_EXPOSURE_PATTERNS) {
        assertNotContains(body, pattern, `${route} body`);
        assertNotContains(html, pattern, `${route} html`);
      }
      if (route.startsWith("/admin")) {
        assertContains(body, "stage3DKakaoSecretRawExposed=false", route);
        assertContains(body, "stage3DOAuthCodeTokenExposed=false", route);
        assertContains(body, "stage3DKakaoSecretRawRecorded=false", route);
        assertContains(
          body,
          "stage3DKakaoSecretPartialHashDigestRecorded=false",
          route,
        );
      }
    }

    // Login hydration strip regression (no code in URL after settle)
    await page.goto(
      `${BASE}/auth/login?code=STAGE3D_FAKE_CODE_SHOULD_STRIP&error=access_denied`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(1500);
    const url = page.url();
    if (url.includes("code=")) {
      throw new Error("login URL still contains code= after hydration");
    }
    console.log("PASS: login URL code strip after hydration");
  } finally {
    await browser.close();
  }
}

async function main() {
  verifyAttestationSource();
  await verifyProductionUi();
  console.log("RESULT: kakaoSecretRawExposed=false");
  console.log("RESULT: oauthCodeTokenExposed=false");
  console.log("RESULT: rawRecorded=false");
  console.log("RESULT: partialHashDigestRecorded=false");
  console.log("PASS: verify:stage3d-kakao-secret-redaction");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
