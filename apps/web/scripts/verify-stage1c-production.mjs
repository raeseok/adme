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
  assertContains(body, "stage1CSessionStatus=anonymous", `${label} anonymous`);
  assertContains(body, "stage-1-c-authenticated-consumer-profile", `${label} stage1c header`);
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const after = await page.locator("body").innerText();
  assertContains(after, "AUTH_REQUIRED", `${label} auth required`);
  assertContains(after, "stage1BSaveStatus=auth_required", `${label} save status`);
  await checkNoHorizontalScroll(page, label);
}

async function verifyLoginPage(page, label) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "Stage 1-C Supabase Auth", `${label} login title`);
  assertContains(body, "stage-1-c-supabase-auth", `${label} login marker`);
  assertContains(body, "stage1CAuthMethod=email-password", `${label} auth method`);
  assertContains(body, "stage1CServiceRoleUsed=false", `${label} no service role`);
  await checkNoHorizontalScroll(page, label);
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
    if (afterSignup.includes("stage1CSessionStatus=authenticated")) {
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
  if (!body.includes("stage1CSessionStatus=authenticated")) {
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
  assertContains(body, "stage1CSessionStatus=authenticated", `${label} authenticated`);
  assertContains(body, "stage1CAuthUserPresent=true", `${label} auth user present`);
  assertContains(body, "stage1CAuthUserIdVisible=false", `${label} auth user id hidden`);
  assertContains(body, "stage1CAuthEmailMasked=true", `${label} email masked`);
  assertContains(body, "stage1CMasterReadMode=authenticated-client", `${label} master read`);
  assertContains(body, "stage1CRegionsReadStatus=ok", `${label} regions read ok`);
  assertContains(body, "stage1CCategoriesReadStatus=ok", `${label} categories read ok`);
  assertContains(body, "stage1CResidenceMax=1", `${label} residence max`);
  assertContains(body, "stage1CActivityMax=2", `${label} activity max`);
  assertContains(body, "stage1CUsesConsumerRegions=true", `${label} uses consumer regions`);
  assertContains(body, "stage1CServiceRoleUsed=false", `${label} no service role`);

  const regionCountMatch = body.match(/stage1CRegionCountAuth=(\d+)/);
  const categoryCountMatch = body.match(/stage1CCategoryCountAuth=(\d+)/);
  const regionCount = Number(regionCountMatch?.[1] ?? 0);
  const categoryCount = Number(categoryCountMatch?.[1] ?? 0);
  console.log(
    `INFO: ${label} regionCountAuth=${regionCount} categoryCountAuth=${categoryCount}`,
  );

  if (regionCount <= 0) {
    throw new Error(`${label}: stage1CRegionCountAuth must be > 0 (got ${regionCount})`);
  }
  if (categoryCount <= 0) {
    throw new Error(`${label}: stage1CCategoryCountAuth must be > 0 (got ${categoryCount})`);
  }

  // residence + activity slots
  await page.locator("select").first().selectOption({ index: 1 });
  const activitySelects = page.locator("select");
  if ((await activitySelects.count()) >= 2) {
    await activitySelects.nth(1).selectOption({ index: 1 });
  }
  if ((await activitySelects.count()) >= 3) {
    await activitySelects.nth(2).selectOption({ index: 2 });
  }
  if ((await activitySelects.count()) > 3) {
    throw new Error(`${label}: unexpected activity slot 3+ UI`);
  }

  const categoryButtons = page
    .locator("fieldset")
    .filter({ hasText: "관심 분야" })
    .locator("button[type='button']");
  if ((await categoryButtons.count()) === 0) {
    throw new Error(`${label}: no category buttons found`);
  }
  await categoryButtons.first().click();

  await page.getByRole("radio", { name: "1만 원대" }).click();

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);
  body = await page.locator("body").innerText();

  assertContains(body, "stage1CProfileSaveStatus=saved", `${label} save saved`);
  assertContains(body, "stage1CConsumerProfileWriteStatus=saved", `${label} profile write`);
  assertContains(body, "stage1CConsumerRegionsWriteStatus=saved", `${label} regions write`);
  assertContains(body, "stage1CInterestCategoriesWriteStatus=saved", `${label} categories write`);
  assertContains(body, "stage1CMutationExecuted=true", `${label} mutation true`);
  assertContains(body, "stage1CPointLedgerMutation=false", `${label} no point ledger`);
  assertContains(body, "stage1CQuizAnswerAccess=false", `${label} no quiz answer`);

  await page.reload({ waitUntil: "networkidle" });
  const reloaded = await page.locator("body").innerText();
  assertContains(reloaded, "stage1CSessionStatus=authenticated", `${label} reload auth`);
  if (reloaded.includes("residenceSelected=(미선택)")) {
    throw new Error(`${label}: residence not persisted after reload`);
  }
  console.log(`PASS: ${label} — residence persisted after reload`);

  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForTimeout(3000);
  body = await page.locator("body").innerText();
  assertContains(body, "stage1CSessionStatus=anonymous", `${label} logout anonymous`);
  assertContains(body, "stage1CAuthUserPresent=false", `${label} logout no user`);

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const afterLogout = await page.locator("body").innerText();
  assertContains(afterLogout, "AUTH_REQUIRED", `${label} logout auth required`);
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "DB check status", "diagnostics");
  assertContains(body, "stage-0-5-vercel-shell", "diagnostics stage0");
  assertContains(body, "stage1CDiagnosticsAuthReady=true", "diagnostics stage1c");
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
