/**
 * Auth helpers for Production E2E — never log passwords or full emails.
 */
import { randomBytes } from "node:crypto";

const AUTH_WAIT_MS = 60000;

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
  const nonce = randomBytes(4).toString("hex");
  const ephemeral = {
    userA: {
      email: `stage1e-a-${ts}-${nonce}@example.com`,
      password: randomBytes(16).toString("base64url"),
    },
    userB: {
      email: `stage1e-b-${ts}-${nonce}@example.com`,
      password: randomBytes(16).toString("base64url"),
    },
    source: "ephemeral",
  };

  console.log(
    `INFO: ADME_TEST_* unset — ephemeral User A/B signup (${maskEmail(ephemeral.userA.email)}, ${maskEmail(ephemeral.userB.email)})`,
  );
  return ephemeral;
}

async function readBodyText(page) {
  return page.locator("body").innerText();
}

async function waitForAuthenticatedProfile(page, baseUrl, label) {
  const deadline = Date.now() + AUTH_WAIT_MS;

  while (Date.now() < deadline) {
    if (!page.url().includes("/consumer/profile")) {
      await page.goto(`${baseUrl}/consumer/profile`, {
        waitUntil: "domcontentloaded",
      });
    }

    const body = await readBodyText(page);
    if (body.includes("로그인됨") && body.includes("***@")) {
      console.log(`PASS: ${label} — authenticated on profile (email masked)`);
      return;
    }

    await page.waitForTimeout(1500);
  }

  const body = await readBodyText(page);
  let hint = "unknown";
  if (body.includes("이메일 확인") || body.includes("가입이 완료")) {
    hint = "email_confirm_or_signup_pending";
  } else if (body.includes("로그인이 필요합니다")) {
    hint = "still_anonymous";
  } else if (body.includes("Invalid login")) {
    hint = "invalid_login";
  }

  throw new Error(`${label}: auth wait timeout (${hint})`);
}

async function submitAuthAndReachProfile(page, baseUrl, buttonName) {
  await Promise.all([
    page.waitForURL("**/consumer/profile**", { timeout: AUTH_WAIT_MS }).catch(() => null),
    page.getByRole("button", { name: buttonName, exact: buttonName === "로그인" }).click(),
  ]);

  if (!page.url().includes("/consumer/profile")) {
    await page.goto(`${baseUrl}/consumer/profile`, { waitUntil: "domcontentloaded" });
  }
}

async function ensureLoginMode(page) {
  const loginToggle = page.getByRole("button", {
    name: "이미 계정이 있으신가요? 로그인",
  });
  if (await loginToggle.isVisible()) {
    await loginToggle.click();
  }
}

async function ensureSignupMode(page) {
  const signupToggle = page.getByRole("button", {
    name: "계정이 없으신가요? 회원가입",
  });
  if (await signupToggle.isVisible()) {
    await signupToggle.click();
  }
}

export async function loginWithEmail(page, baseUrl, label, email, password) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await ensureLoginMode(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await submitAuthAndReachProfile(page, baseUrl, "로그인");
  await waitForAuthenticatedProfile(page, baseUrl, label);
}

export async function signupOrLogin(page, baseUrl, label, email, password) {
  const supabaseModule = await import("./supabase-auth-session.mjs");
  const supabase = await supabaseModule.createAnonSupabaseClient(baseUrl);
  if (supabase) {
    try {
      const session = await supabaseModule.createEphemeralSupabaseSession(
        email,
        password,
        baseUrl,
      );
      await supabaseModule.injectSupabaseSession(page.context(), baseUrl, session);
      await waitForAuthenticatedProfile(page, baseUrl, label);
      console.log(`PASS: ${label} — ephemeral API auth ok (email masked)`);
      return;
    } catch {
      console.log(`INFO: ${label} — API auth unavailable, using UI signup`);
    }
  }

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await ensureSignupMode(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await submitAuthAndReachProfile(page, baseUrl, "회원가입");

  try {
    await waitForAuthenticatedProfile(page, baseUrl, label);
    console.log(`PASS: ${label} — User signup ok (email masked)`);
    return;
  } catch {
    await loginWithEmail(page, baseUrl, `${label} login-after-signup`, email, password);
  }
}

export async function authenticateUser(page, baseUrl, label, email, password) {
  await signupOrLogin(page, baseUrl, label, email, password);
}

export async function gotoProfile(page, baseUrl) {
  await page.goto(`${baseUrl}/consumer/profile`, { waitUntil: "domcontentloaded" });
}

export async function logoutFromProfile(page, baseUrl, label) {
  await gotoProfile(page, baseUrl);
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("로그인이 필요합니다") ?? false,
    { timeout: AUTH_WAIT_MS },
  );
  const body = await readBodyText(page);
  if (!body.includes("로그인이 필요합니다")) {
    throw new Error(`${label}: expected anonymous state after logout`);
  }
  console.log(`PASS: ${label} — logout anonymous`);
}

export async function verifyAnonymousSaveBlocked(page, label) {
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const body = await readBodyText(page);
  if (!body.includes("로그인이 필요합니다")) {
    throw new Error(`${label}: anonymous save should be blocked`);
  }
  console.log(`PASS: ${label} — AUTH_REQUIRED anonymous save blocked`);
}
