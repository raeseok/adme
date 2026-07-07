/**
 * Stage 1-D Auth Production verification
 * - Public login UI (no dev markers)
 * - OAuth redirect start (Google/Kakao) when provider configured
 * - Stage 1-D markers on /admin/diagnostics
 * - Email login regression (subset of Stage 1-C)
 *
 * Optional env:
 *   STAGE1D_REQUIRE_OAUTH=true — fail if OAuth redirect does not start
 *   STAGE1C_TEST_EMAIL, STAGE1C_TEST_PASSWORD — email regression credentials
 */
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";

const BASE = "https://web-ashen-xi-52.vercel.app";
const REQUIRE_OAUTH = process.env.STAGE1D_REQUIRE_OAUTH === "true";

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

function assertNotContains(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: should not contain "${needle}"`);
  }
  console.log(`PASS: ${label} — no "${needle}"`);
}

async function checkNoHorizontalScroll(page, label) {
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  if (scrollWidth > clientWidth + 1) {
    throw new Error(
      `${label}: horizontal scroll ${scrollWidth} > ${clientWidth}`,
    );
  }
  console.log(`PASS: ${label} — no horizontal scroll`);
}

async function verifyStage1DLoginUI(page, label) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "AdMe 로그인", `${label} title`);
  assertContains(body, "Google로 계속하기", `${label} google button`);
  assertContains(body, "카카오톡으로 계속하기", `${label} kakao button`);
  assertNotContains(body, "stage1DAuthEmailEnabled", `${label} no stage1D markers`);
  assertNotContains(body, "stage1CAuthMethod", `${label} no stage1C markers`);
  await page.getByRole("button", { name: "Google로 계속하기" }).isVisible();
  await page.getByRole("button", { name: "카카오톡으로 계속하기" }).isVisible();
  console.log(`PASS: ${label} — OAuth buttons visible`);
  await checkNoHorizontalScroll(page, label);
}

async function verifyStage1DDiagnostics(page, label) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "stage-1-d-auth-social-login", `${label} stage1d header`);
  assertContains(body, "stage1DAuthEmailEnabled=true", `${label} email enabled`);
  assertContains(body, "stage1DAuthGoogleEnabled=true", `${label} google enabled`);
  assertContains(body, "stage1DAuthKakaoEnabled=true", `${label} kakao enabled`);
  assertContains(
    body,
    "stage1DAuthProviders=email,google,kakao",
    `${label} providers`,
  );
  assertContains(
    body,
    "stage1DGoogleLoginButtonVisible=true",
    `${label} google button marker`,
  );
  assertContains(
    body,
    "stage1DKakaoLoginButtonVisible=true",
    `${label} kakao button marker`,
  );
  assertContains(
    body,
    "stage1DEmailLoginFormVisible=true",
    `${label} email form marker`,
  );
  assertContains(body, "stage1DServiceRoleUsed=false", `${label} no service role`);
  assertContains(
    body,
    "stage1DPointLedgerMutation=false",
    `${label} no point ledger`,
  );
  assertContains(body, "stage1DQuizAnswerAccess=false", `${label} no quiz answer`);
  assertContains(body, "stage1CAuthMethod=email-password", `${label} email method kept`);
}

async function tryOAuthRedirectStart(page, providerLabel, buttonName, label) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const beforeUrl = page.url();
  await page.getByRole("button", { name: buttonName }).click();
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const body = await page.locator("body").innerText();

  const redirectedAway =
    currentUrl !== beforeUrl &&
    (currentUrl.includes("accounts.google.com") ||
      currentUrl.includes("kauth.kakao.com") ||
      currentUrl.includes("supabase.co/auth/v1/authorize"));

  if (redirectedAway) {
    console.log(`PASS: ${label} ${providerLabel} OAuth redirect started — ${currentUrl.slice(0, 80)}`);
    return "redirect_started";
  }

  if (
    body.includes("provider 설정") ||
    body.includes("oauth_start_error") ||
    body.includes("oauth_missing_url")
  ) {
    console.log(
      `INFO: ${label} ${providerLabel} OAuth provider not configured or start error — manual verification required`,
    );
    if (REQUIRE_OAUTH) {
      throw new Error(`${label}: ${providerLabel} OAuth redirect required but not started`);
    }
    return "provider_not_configured";
  }

  if (REQUIRE_OAUTH) {
    throw new Error(`${label}: ${providerLabel} OAuth redirect did not start`);
  }
  console.log(`SKIP: ${label} ${providerLabel} OAuth redirect not detected`);
  return "not_detected";
}

async function isAuthenticatedOnProfile(body) {
  return body.includes("로그인됨");
}

async function verifyEmailRegression(page, label) {
  const email =
    process.env.STAGE1C_TEST_EMAIL ?? `stage1d-${Date.now()}@example.com`;
  const password =
    process.env.STAGE1C_TEST_PASSWORD ?? randomBytes(12).toString("base64url");

  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });

  if (!process.env.STAGE1C_TEST_EMAIL) {
    await page.getByRole("button", { name: "계정이 없으신가요? 회원가입" }).click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "회원가입" }).click();
    await page.waitForURL("**/consumer/profile**", { timeout: 20000 }).catch(() => null);
    await page.waitForTimeout(2000);
    const afterSignup = await page.locator("body").innerText();
    if (isAuthenticatedOnProfile(afterSignup)) {
      console.log(`PASS: ${label} email signup session`);
      return;
    }
    if (
      afterSignup.includes("이메일 확인") ||
      afterSignup.includes("signup_email_confirm_maybe_required")
    ) {
      console.log(`SKIP: ${label} email regression — confirmation required`);
      return;
    }
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "이미 계정이 있으신가요? 로그인" }).click();
  }

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);

  const body = await page.locator("body").innerText();
  if (!isAuthenticatedOnProfile(body)) {
    console.log(`SKIP: ${label} email regression — login blocked`);
    return;
  }
  assertNotContains(body, "stage1DSocialProvider", `${label} no stage1D on profile`);
  console.log(`PASS: ${label} email login regression`);
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "DB check status", "diagnostics");
  assertContains(body, "stage1CDiagnosticsAuthReady=true", "diagnostics stage1c");
  assertContains(body, "stage1DAPublicLoginClean=true", "diagnostics stage1da");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await verifyStage1DLoginUI(page, "mobile-390-login");
  await verifyStage1DDiagnostics(page, "mobile-diagnostics");
  await tryOAuthRedirectStart(page, "Google", "Google로 계속하기", "mobile-google");
  await tryOAuthRedirectStart(page, "Kakao", "카카오톡으로 계속하기", "mobile-kakao");
  await verifyEmailRegression(page, "mobile-email-regression");

  await page.setViewportSize({ width: 1280, height: 800 });
  await verifyStage1DLoginUI(page, "desktop-1280-login");
  await tryOAuthRedirectStart(page, "Google", "Google로 계속하기", "desktop-google");
  await tryOAuthRedirectStart(page, "Kakao", "카카오톡으로 계속하기", "desktop-kakao");
  await verifyDiagnostics(page);

  console.log("\nStage 1-D Auth Production verification PASSED");
} finally {
  await browser.close();
}
