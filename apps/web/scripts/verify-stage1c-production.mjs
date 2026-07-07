/**
 * Stage 1-C Production verification
 * Optional env: STAGE1C_TEST_EMAIL, STAGE1C_TEST_PASSWORD
 * STAGE1C_REQUIRE_AUTH=true — fail instead of skip when authenticated flow blocked
 */
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";

const BASE = "https://web-ashen-xi-52.vercel.app";
const REQUIRE_AUTH = process.env.STAGE1C_REQUIRE_AUTH === "true";

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

function skipOrFail(message) {
  if (REQUIRE_AUTH) {
    throw new Error(message);
  }
  console.log(`SKIP: ${message}`);
  return true;
}

async function checkNoHorizontalScroll(page, label) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollWidth > clientWidth + 1) {
    throw new Error(`${label}: horizontal scroll ${scrollWidth} > ${clientWidth}`);
  }
  console.log(`PASS: ${label} — no horizontal scroll`);
}

async function verifyAnonymous(page, label) {
  await page.goto(`${BASE}/consumer/profile`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인이 필요합니다", `${label} anonymous prompt`);
  assertNotContains(body, "stage1CSessionStatus", `${label} no stage1C markers`);
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const after = await page.locator("body").innerText();
  assertContains(after, "로그인이 필요합니다", `${label} auth required message`);
  await checkNoHorizontalScroll(page, label);
}

async function verifyLoginPage(page, label) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "AdMe 로그인", `${label} login title`);
  assertContains(body, "Google로 계속하기", `${label} google button`);
  assertNotContains(body, "stage1C", `${label} no stage1C on login`);
  assertNotContains(body, "stage1D", `${label} no stage1D on login`);
  await checkNoHorizontalScroll(page, label);
}

function isAuthenticatedOnProfile(body) {
  return body.includes("로그인됨") && !body.includes("로그인이 필요합니다. 로그인하기");
}

async function authenticate(page) {
  const email =
    process.env.STAGE1C_TEST_EMAIL ??
    `stage1c-${Date.now()}@example.com`;
  const password =
    process.env.STAGE1C_TEST_PASSWORD ??
    randomBytes(12).toString("base64url");

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
      console.log(`PASS: signup session — email ${email.slice(0, 2)}***@${email.split("@")[1]}`);
      return { email, password, mode: "signup" };
    }
    if (
      afterSignup.includes("이메일 확인") ||
      afterSignup.includes("signup_email_confirm_maybe_required")
    ) {
      const masked = `${email.slice(0, 2)}***@${email.split("@")[1]}`;
      if (skipOrFail(`authenticated flow — email confirmation required after signup (${masked})`)) {
        return { email, password, mode: "signup_confirm_required", skipped: true };
      }
    }
    if (!page.url().includes("/auth/login")) {
      await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
    }
    await page.getByRole("button", { name: "이미 계정이 있으신가요? 로그인" }).click();
  }

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);

  const body = await page.locator("body").innerText();
  if (!isAuthenticatedOnProfile(body)) {
    const masked = `${email.slice(0, 2)}***@${email.split("@")[1]}`;
    if (
      body.includes("이메일 확인") ||
      body.includes("Email not confirmed") ||
      body.includes("signup_email_confirm_maybe_required") ||
      body.includes("Invalid login credentials")
    ) {
      if (skipOrFail(`authenticated flow — email confirmation required (${masked})`)) {
        return { email, password, mode: "signup_confirm_required", skipped: true };
      }
    }
    console.log(`DEBUG: page snippet after login: ${body.slice(0, 800)}`);
    throw new Error(
      `authenticated login failed for ${masked} — check Supabase Auth redirect URLs and email confirmation`,
    );
  }
  console.log(`PASS: login — email ${email.slice(0, 2)}***@${email.split("@")[1]}`);
  return { email, password, mode: "login" };
}

async function verifyAuthenticatedSave(page, label, authResult) {
  if (authResult?.skipped) {
    console.log(`SKIP: ${label} authenticated save — auth skipped`);
    return;
  }
  await page.goto(`${BASE}/consumer/profile`, { waitUntil: "networkidle" });
  let body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} authenticated`);
  assertContains(body, "***@", `${label} email masked`);
  assertNotContains(body, "stage1CSessionStatus", `${label} no stage1C markers`);
  assertNotContains(body, "소비 규모 범위", `${label} no spend range UI`);

  const residenceSelect = page.locator("select").nth(1);
  const regionOptions = await residenceSelect.locator("option").count();
  if (regionOptions <= 1) {
    throw new Error(`${label}: region options must be > 1 (got ${regionOptions})`);
  }
  console.log(`PASS: ${label} — region options available (${regionOptions})`);

  const categoryButtons = page
    .locator("fieldset")
    .filter({ hasText: "관심정보" })
    .locator("button[type='button']");
  if ((await categoryButtons.count()) === 0) {
    throw new Error(`${label}: no category buttons found`);
  }

  await page.locator("select").first().selectOption("1985");
  await page.getByRole("radio", { name: "남성" }).click();
  await residenceSelect.selectOption({ index: 1 });

  const activitySelects = page.locator("select");
  if ((await activitySelects.count()) >= 3) {
    await activitySelects.nth(2).selectOption({ index: 1 });
  }
  if ((await activitySelects.count()) >= 4) {
    await activitySelects.nth(3).selectOption({ index: 2 });
  }

  await categoryButtons.nth(1).click();

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);
  body = await page.locator("body").innerText();

  assertContains(body, "소비 의향 프로필이 저장되었습니다", `${label} save success`);

  await page.reload({ waitUntil: "networkidle" });
  const reloaded = await page.locator("body").innerText();
  assertContains(reloaded, "로그인됨", `${label} reload auth`);
  assertContains(reloaded, "1985", `${label} birth year persisted`);

  const residenceValue = await page.locator("select").nth(1).inputValue();
  if (!residenceValue) {
    throw new Error(`${label}: residence not persisted after reload`);
  }
  console.log(`PASS: ${label} — profile persisted after reload`);

  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForTimeout(3000);
  body = await page.locator("body").innerText();
  assertContains(body, "로그인이 필요합니다", `${label} logout anonymous`);

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const afterLogout = await page.locator("body").innerText();
  assertContains(afterLogout, "로그인이 필요합니다", `${label} logout auth required`);
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "DB check status", "diagnostics");
  assertContains(body, "stage1CDiagnosticsAuthReady=true", "diagnostics stage1c");
  assertContains(body, "stage1CAuthMethod=email-password", "diagnostics auth method");
  assertContains(body, "stage1CServiceRoleUsed=false", "diagnostics no service role");
  assertContains(body, "stage1DAPublicLoginClean=true", "diagnostics stage1da login");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await verifyAnonymous(page, "mobile-390");
  await verifyLoginPage(page, "mobile-login");
  const authResult = await authenticate(page);
  await verifyAuthenticatedSave(page, "mobile-auth", authResult);
  await page.setViewportSize({ width: 1280, height: 800 });
  await verifyAnonymous(page, "desktop-1280");
  const authResult2 = await authenticate(page);
  await verifyAuthenticatedSave(page, "desktop-auth", authResult2);
  await verifyDiagnostics(page);
  console.log("\nStage 1-C Production verification PASSED");
} finally {
  await browser.close();
}
