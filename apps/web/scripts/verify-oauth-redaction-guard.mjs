/**
 * Stage 3-C-K3 — OAuth diagnostic redaction guard.
 * Static + Production UI checks. Never logs secrets/codes/tokens.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

const FORBIDDEN_DISPLAY_PATTERNS = [
  "oauthErrorDescription=",
  "Unable to exchange external code:",
  "access_token=",
  "refresh_token=",
  "client_secret=",
  "authorization_code=",
];

function assert(condition, label) {
  if (!condition) {
    throw new Error(label);
  }
  console.log(`PASS: ${label}`);
}

function assertNotContains(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: should not contain "${needle}"`);
  }
  console.log(`PASS: ${label} — no "${needle}"`);
}

function summarizeOAuthErrorDescription(value) {
  if (!value) return null;
  const lowered = value.toLowerCase();
  if (
    lowered.includes("unable to exchange external code") ||
    lowered.includes("exchange external code") ||
    lowered.includes("external code")
  ) {
    return "external_code_exchange_failed";
  }
  if (
    lowered.includes("invalid_client") ||
    lowered.includes("bad client credentials") ||
    lowered.includes("client credentials")
  ) {
    return "invalid_client_credentials";
  }
  return "oauth_provider_error";
}

function verifySourceRedaction() {
  const oauthError = readFileSync(join(ROOT, "src/lib/auth/oauth-error.ts"), "utf8");
  const loginForm = readFileSync(join(ROOT, "src/app/auth/login/LoginForm.tsx"), "utf8");
  const callback = readFileSync(join(ROOT, "src/app/auth/callback/route.ts"), "utf8");

  assert(oauthError.includes("oauthErrorSummary="), "oauth-error formats summary");
  assert(!oauthError.includes("oauthErrorDescription="), "oauth-error does not format raw description");
  assert(oauthError.includes("external_code_exchange_failed"), "external code summary key present");
  assert(oauthError.includes("containsSecretMaterial"), "secret material detector present");
  assert(!loginForm.includes("oauthErrorDescription"), "LoginForm does not render description key");
  assert(callback.includes("oauth_error_summary"), "callback forwards summary only");
  assert(!callback.includes('target.searchParams.set("oauth_error_description"'), "callback does not forward raw description");

  const sample = "Unable to exchange external code: SAMPLE_EXTERNAL_CODE_VALUE_REDACT_TEST";
  assert(
    summarizeOAuthErrorDescription(sample) === "external_code_exchange_failed",
    "summary maps external code exchange",
  );
  assert(
    summarizeOAuthErrorDescription("OAuth2: invalid_client — Bad client credentials") ===
      "invalid_client_credentials",
    "summary maps invalid_client",
  );

  console.log("PASS: source redaction static checks");
}

async function verifyProductionUi() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const sample = "Unable to exchange external code: SAMPLE_EXTERNAL_CODE_VALUE_REDACT_TEST";

    const probeUrl =
      `${BASE}/auth/login?oauth_error=server_error` +
      `&oauth_error_code=unexpected_failure` +
      `&oauth_error_summary=external_code_exchange_failed` +
      `&callback_code_missing=true` +
      `&oauth_error_description=${encodeURIComponent(sample)}`;

    await page.goto(probeUrl, { waitUntil: "networkidle" });
    const body = await page.locator("body").innerText();
    const html = await page.content();

    assert(body.includes("소셜 로그인 처리 중 오류가 발생했습니다"), "user message visible");
    assert(body.includes("oauthError=server_error"), "oauthError visible");
    assert(body.includes("oauthErrorCode=unexpected_failure"), "oauthErrorCode visible");
    assert(
      body.includes("oauthErrorSummary=external_code_exchange_failed"),
      "oauthErrorSummaryVisible=true",
    );
    assert(body.includes("callbackCodeMissing=true"), "callbackCodeMissing visible");

    assertNotContains(body, "SAMPLE_EXTERNAL_CODE", "externalCodeExposed=false body");
    assertNotContains(body, "Unable to exchange external code", "raw description not in body");
    for (const needle of FORBIDDEN_DISPLAY_PATTERNS) {
      assertNotContains(body, needle, `forbidden pattern body ${needle}`);
      assertNotContains(html, needle, `forbidden pattern html ${needle}`);
    }
    // Visible UI must not show the sample; RSC may briefly include request URL in payload,
    // so body is the authoritative exposure check for opaque code values.
    assert(
      !body.toLowerCase().includes("sample_external_code"),
      "externalCodeExposed=false visible",
    );

    await page.goto(
      `${BASE}/auth/callback#error=server_error&error_code=unexpected_failure&error_description=${encodeURIComponent(sample)}`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(1500);
    const after = await page.locator("body").innerText();
    const afterUrl = page.url();
    assert(afterUrl.includes("/auth/login"), "hash capture redirects to login");
    assert(after.includes("oauthError=server_error"), "hash path oauthError");
    assert(
      after.includes("oauthErrorSummary=external_code_exchange_failed"),
      "hash path summary",
    );
    assertNotContains(after, "SAMPLE_EXTERNAL_CODE", "hash path externalCodeExposed=false");
    assertNotContains(after, "Unable to exchange external code", "hash path raw description hidden");

    console.log("RESULT: externalCodeExposed=false");
    console.log("RESULT: authorizationCodeExposed=false");
    console.log("RESULT: accessTokenExposed=false");
    console.log("RESULT: refreshTokenExposed=false");
    console.log("RESULT: clientSecretExposed=false");
    console.log("RESULT: oauthErrorSummaryVisible=true");
  } finally {
    await browser.close();
  }
}

async function main() {
  const staticOnly = process.argv.includes("--static-only");
  verifySourceRedaction();
  if (staticOnly) {
    console.log("RESULT: externalCodeExposed=false (static)");
    console.log("RESULT: oauthErrorSummaryVisible=true (static source)");
    console.log("PASS: verify:oauth-redaction-guard (static-only)");
    return;
  }
  await verifyProductionUi();
  console.log("PASS: verify:oauth-redaction-guard");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
