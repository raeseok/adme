/**
 * Auth helpers for Production E2E — never log passwords or full emails.
 */
import { randomBytes } from "node:crypto";

export function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

export function loadTestCredentials() {
  const userA = {
    email: process.env.ADME_TEST_EMAIL_A?.trim() ?? "",
    password: process.env.ADME_TEST_PASSWORD_A ?? "",
  };
  const userB = {
    email: process.env.ADME_TEST_EMAIL_B?.trim() ?? "",
    password: process.env.ADME_TEST_PASSWORD_B ?? "",
  };
  return { userA, userB };
}

/**
 * Prefer ADME_TEST_* env vars. When unset, create ephemeral test-only accounts.
 */
export function resolveTestCredentials() {
  const loaded = loadTestCredentials();
  const hasA = Boolean(loaded.userA.email && loaded.userA.password);
  const hasB = Boolean(loaded.userB.email && loaded.userB.password);

  if (hasA && hasB) {
    console.log("INFO: Using configured User A / User B test credentials");
    return { ...loaded, source: "env" };
  }

  const ts = Date.now();
  const ephemeral = {
    userA: {
      email: `stage1e-a-${ts}@example.com`,
      password: randomBytes(16).toString("base64url"),
    },
    userB: {
      email: `stage1e-b-${ts}@example.com`,
      password: randomBytes(16).toString("base64url"),
    },
    source: "ephemeral",
  };

  console.log(
    `INFO: ADME_TEST_* unset — ephemeral User A/B signup (${maskEmail(ephemeral.userA.email)}, ${maskEmail(ephemeral.userB.email)})`,
  );
  return ephemeral;
}

export async function loginWithEmail(page, baseUrl, label, email, password) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle" });
  const loginToggle = page.getByRole("button", { name: "이미 계정이 있으신가요? 로그인" });
  if (await loginToggle.isVisible()) {
    await loginToggle.click();
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 25000 });
  await page.waitForTimeout(1500);

  const body = await page.locator("body").innerText();
  if (!body.includes("로그인됨")) {
    throw new Error(`${label}: login failed`);
  }
  if (!body.includes("***@")) {
    throw new Error(`${label}: masked email not shown`);
  }
  console.log(`PASS: ${label} — User login ok (email masked)`);
}

export async function signupOrLogin(page, baseUrl, label, email, password) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "계정이 없으신가요? 회원가입" }).click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "회원가입" }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 25000 }).catch(() => null);
  await page.waitForTimeout(1500);

  await page.waitForTimeout(3000);
  const body = await page.locator("body").innerText();
  if (body.includes("로그인됨")) {
    await page.waitForTimeout(2000);
  }
  const after = await page.locator("body").innerText();
  if (after.includes("로그인됨")) {
    console.log(`PASS: ${label} — User signup ok (email masked)`);
    return;
  }

  if (!page.url().includes("/auth/login")) {
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle" });
  }
  await loginWithEmail(page, baseUrl, label, email, password);
}

export async function authenticateUser(page, baseUrl, label, email, password) {
  await signupOrLogin(page, baseUrl, label, email, password);
}

export async function gotoProfile(page, baseUrl) {
  await page.goto(`${baseUrl}/consumer/profile`, { waitUntil: "networkidle" });
}

export async function logoutFromProfile(page, baseUrl, label) {
  await gotoProfile(page, baseUrl);
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("로그인이 필요합니다"),
    { timeout: 15000 },
  );
  const body = await page.locator("body").innerText();
  if (!body.includes("로그인이 필요합니다")) {
    throw new Error(`${label}: expected anonymous state after logout`);
  }
  console.log(`PASS: ${label} — logout anonymous`);
}

export async function verifyAnonymousSaveBlocked(page, label) {
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const body = await page.locator("body").innerText();
  if (!body.includes("로그인이 필요합니다")) {
    throw new Error(`${label}: anonymous save should be blocked`);
  }
  console.log(`PASS: ${label} — AUTH_REQUIRED anonymous save blocked`);
}
