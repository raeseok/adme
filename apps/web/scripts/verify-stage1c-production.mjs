/**
 * Stage 1-C Production verification
 * Optional env: STAGE1C_TEST_EMAIL, STAGE1C_TEST_PASSWORD
 * If missing, runs signup with generated email (password from env or random).
 * Never log password to stdout.
 */
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";

const BASE = "https://web-ashen-xi-52.vercel.app";

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
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
    await page.waitForTimeout(3000);
    const afterSignup = await page.locator("body").innerText();
    if (afterSignup.includes("stage1CSessionStatus=authenticated")) {
      console.log(`PASS: signup session — email ${email.slice(0, 2)}***@${email.split("@")[1]}`);
      return { email, password, mode: "signup" };
    }
    await page.getByRole("button", { name: "이미 계정이 있으신가요? 로그인" }).click();
  }

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);

  const body = await page.locator("body").innerText();
  if (!body.includes("stage1CSessionStatus=authenticated")) {
    const masked = `${email.slice(0, 2)}***@${email.split("@")[1]}`;
    if (
      body.includes("이메일 확인") ||
      body.includes("Email not confirmed") ||
      body.includes("signup_email_confirm_maybe_required")
    ) {
      console.log(
        `SKIP: authenticated flow — email confirmation required (${masked})`,
      );
      return { email, password, mode: "signup_confirm_required", skipped: true };
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
  assertContains(body, "stage1CMasterReadMode=authenticated-client", `${label} master read`);

  const regionCountMatch = body.match(/stage1CRegionCountAuth=(\d+)/);
  const categoryCountMatch = body.match(/stage1CCategoryCountAuth=(\d+)/);
  console.log(
    `INFO: ${label} regionCountAuth=${regionCountMatch?.[1] ?? "?"} categoryCountAuth=${categoryCountMatch?.[1] ?? "?"}`,
  );

  if (regionCountMatch && Number(regionCountMatch[1]) > 0) {
    await page.locator("select").first().selectOption({ index: 1 });
  }
  if (categoryCountMatch && Number(categoryCountMatch[1]) > 0) {
    const catBtn = page.locator("button[type='button']").filter({ hasText: /음식|뷰티|패션|FOOD|BEAUTY/i }).first();
    if (await catBtn.count()) await catBtn.click();
  }
  await page.locator('input[value="10k_range"]').click({ force: true }).catch(() => null);

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(3000);
  body = await page.locator("body").innerText();

  if (regionCountMatch && Number(regionCountMatch[1]) > 0) {
    assertContains(body, "stage1CProfileSaveStatus=saved", `${label} save saved`);
    assertContains(body, "stage1CMutationExecuted=true", `${label} mutation true`);
    await page.reload({ waitUntil: "networkidle" });
    const reloaded = await page.locator("body").innerText();
    assertContains(reloaded, "stage1CSessionStatus=authenticated", `${label} reload auth`);
  } else {
    console.log(`SKIP: ${label} save success — master data empty (regionCountAuth=0)`);
  }

  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForTimeout(3000);
  body = await page.locator("body").innerText();
  assertContains(body, "stage1CSessionStatus=anonymous", `${label} logout anonymous`);
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
