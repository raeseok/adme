/**
 * Auth helpers for Production E2E — never log passwords or full emails.
 */

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

export function requireUserACredentials(userA) {
  if (!userA.email || !userA.password) {
    console.error("FAIL: credentials_missing — set ADME_TEST_EMAIL_A and ADME_TEST_PASSWORD_A");
    return false;
  }
  return true;
}

export function requireBothCredentials(userA, userB) {
  if (!requireUserACredentials(userA)) return false;
  if (!userB.email || !userB.password) {
    console.error("FAIL: credentials_missing — set ADME_TEST_EMAIL_B and ADME_TEST_PASSWORD_B");
    return false;
  }
  return true;
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
    throw new Error(`${label}: login failed for User ${label.includes("B") ? "B" : "A"}`);
  }
  if (!body.includes("***@")) {
    throw new Error(`${label}: masked email not shown`);
  }
  console.log(`PASS: ${label} — User login ok (email masked)`);
}

export async function gotoProfile(page, baseUrl) {
  await page.goto(`${baseUrl}/consumer/profile`, { waitUntil: "networkidle" });
}

export async function logoutFromProfile(page, baseUrl, label) {
  await gotoProfile(page, baseUrl);
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForTimeout(2500);
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
