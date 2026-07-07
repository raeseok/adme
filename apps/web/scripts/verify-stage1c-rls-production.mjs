/**
 * Stage 1-C-R2 Production RLS cross-user isolation verification
 * Optional env: STAGE1C_USER_A_EMAIL, STAGE1C_USER_A_PASSWORD,
 *               STAGE1C_USER_B_EMAIL, STAGE1C_USER_B_PASSWORD
 * Never log passwords.
 */
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";

const BASE = "https://web-ashen-xi-52.vercel.app";

function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

async function getFormSelection(page) {
  const selects = page.locator("select");
  return {
    residenceId: await selects.first().inputValue(),
    activity1Id:
      (await selects.count()) >= 2 ? await selects.nth(1).inputValue() : "",
    activity2Id:
      (await selects.count()) >= 3 ? await selects.nth(2).inputValue() : "",
  };
}

async function getSelectedCategoryCount(page) {
  const selected = page
    .locator("fieldset")
    .filter({ hasText: "관심 분야" })
    .locator("button.border-blue-600.bg-blue-600");
  return selected.count();
}

function parseSummary(body) {
  const get = (key) => {
    const m = body.match(new RegExp(`${key}=([^\\n]+)`));
    return m ? m[1].trim() : null;
  };
  return {
    residence: get("residenceSelected"),
    activity1: get("activitySlot1Selected"),
    activity2: get("activitySlot2Selected"),
    categoryCount: get("selectedCategoryCount"),
    spendRange: get("spendRangeSelected"),
  };
}

async function signupOrLogin(page, label, email, password) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "계정이 없으신가요? 회원가입" }).click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "회원가입" }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(1500);

  let body = await page.locator("body").innerText();
  if (body.includes("로그인됨")) {
    console.log(`PASS: ${label} signup — ${maskEmail(email)}`);
    return;
  }

  if (!page.url().includes("/auth/login")) {
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  }
  await page.getByRole("button", { name: "이미 계정이 있으신가요? 로그인" }).click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL("**/consumer/profile**", { timeout: 20000 });
  await page.waitForTimeout(1500);

  let body = await page.locator("body").innerText();
  if (!body.includes("로그인됨")) {
    throw new Error(`${label} login failed for ${maskEmail(email)}`);
  }
  console.log(`PASS: ${label} login — ${maskEmail(email)}`);
}

async function gotoProfile(page) {
  await page.goto(`${BASE}/consumer/profile`, { waitUntil: "networkidle" });
}

async function saveProfile(page, label, opts) {
  const {
    residenceIndex = 1,
    activity1Index = 2,
    activity2Index = 3,
    categoryIndex = 0,
    spendRangeLabel = "1만 원대",
  } = opts;

  await gotoProfile(page);
  let body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} authenticated`);

  const selects = page.locator("select");
  await selects.first().selectOption({ index: residenceIndex });
  if ((await selects.count()) >= 2) {
    await selects.nth(1).selectOption({ index: activity1Index });
  }
  if ((await selects.count()) >= 3) {
    await selects.nth(2).selectOption({ index: activity2Index });
  }

  const categoryButtons = page
    .locator("fieldset")
    .filter({ hasText: "관심 분야" })
    .locator("button[type='button']");
  await categoryButtons.nth(categoryIndex).click();
  await page.getByRole("radio", { name: spendRangeLabel }).click();

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);

  body = await page.locator("body").innerText();
  assertContains(body, "소비 의향 프로필이 저장되었습니다", `${label} save saved`);

  const form = await getFormSelection(page);
  return { summary: parseSummary(body), form };
}

async function reloadAndGetSummary(page, label) {
  await page.reload({ waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} reload auth`);
  return parseSummary(body);
}

async function logout(page, label) {
  await gotoProfile(page);
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForTimeout(3000);
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인이 필요합니다", `${label} logout anonymous`);
  return body;
}

async function verifyAnonymousSaveBlocked(page, label) {
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인이 필요합니다", `${label} auth required`);
  assertContains(body, "stage1BSaveStatus=auth_required", `${label} save blocked`);
}

function assertSummaryEquals(actual, expected, label) {
  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      throw new Error(
        `${label}: ${key} expected "${expected[key]}" got "${actual[key]}"`,
      );
    }
  }
  console.log(`PASS: ${label} — summary matches expected`);
}

function assertSummaryDiffers(actual, other, label) {
  if (
    other.residence &&
    other.residence !== "(미선택)" &&
    actual.residence === other.residence
  ) {
    throw new Error(`${label}: residence leaked — ${actual.residence}`);
  }
  if (
    other.activity1 &&
    other.activity1 !== "(미선택)" &&
    actual.activity1 === other.activity1
  ) {
    throw new Error(`${label}: activity1 leaked — ${actual.activity1}`);
  }
  if (
    other.spendRange &&
    other.spendRange !== "(미선택)" &&
    actual.spendRange === other.spendRange
  ) {
    throw new Error(`${label}: spendRange leaked — ${actual.spendRange}`);
  }
  console.log(`PASS: ${label} — no cross-user summary leak detected`);
}

async function verifyUserBNoLeak(page, label, userASummary, userAForm) {
  await gotoProfile(page);
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} B authenticated`);
  assertContains(body, "***@", `${label} B email masked`);

  const summary = parseSummary(body);
  assertSummaryDiffers(summary, userASummary, `${label} summary isolation`);

  if (summary.residence !== "(미선택)") {
    throw new Error(`${label}: B should have empty residence, got ${summary.residence}`);
  }
  console.log(`PASS: ${label} — B residence empty in summary`);

  const form = await getFormSelection(page);
  if (form.residenceId) {
    throw new Error(`${label}: B residence select should be empty, got id set`);
  }
  if (userAForm.residenceId && form.residenceId === userAForm.residenceId) {
    throw new Error(`${label}: B residence id matches A`);
  }
  console.log(`PASS: ${label} — B form selections empty / not A's ids`);

  const catCount = await getSelectedCategoryCount(page);
  if (catCount > 0) {
    throw new Error(`${label}: B should have no selected categories, got ${catCount}`);
  }
  console.log(`PASS: ${label} — B no pre-selected categories`);

  return { summary, form };
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "DB check status", "diagnostics");
  assertContains(body, "stage1CDiagnosticsAuthReady=true", "diagnostics stage1c");
  assertContains(body, "stage1DAPublicProfileClean=true", "diagnostics stage1da profile");
}

async function runCrossUserFlow(page, viewportLabel) {
  const ts = Date.now();
  const userA = {
    email: process.env.STAGE1C_USER_A_EMAIL ?? `stage1c-a-${ts}@example.com`,
    password: process.env.STAGE1C_USER_A_PASSWORD ?? randomBytes(12).toString("base64url"),
  };
  const userB = {
    email: process.env.STAGE1C_USER_B_EMAIL ?? `stage1c-b-${ts}@example.com`,
    password: process.env.STAGE1C_USER_B_PASSWORD ?? randomBytes(12).toString("base64url"),
  };

  console.log(`\n=== ${viewportLabel} A/B RLS flow ===`);
  console.log(`INFO: userA=${maskEmail(userA.email)} userB=${maskEmail(userB.email)}`);

  // User A: signup, save, reload
  await signupOrLogin(page, `${viewportLabel} userA`, userA.email, userA.password);
  const { summary: summaryA, form: formA } = await saveProfile(
    page,
    `${viewportLabel} userA-save`,
    {
      residenceIndex: 1,
      activity1Index: 2,
      activity2Index: 3,
      categoryIndex: 0,
      spendRangeLabel: "1만 원대",
    },
  );
  const summaryAReload = await reloadAndGetSummary(page, `${viewportLabel} userA-reload`);
  assertSummaryEquals(summaryAReload, summaryA, `${viewportLabel} userA reload`);

  // Logout + anonymous block
  await logout(page, `${viewportLabel} userA-logout`);
  await verifyAnonymousSaveBlocked(page, `${viewportLabel} anon-block`);

  // User B: no A data, save different profile
  await signupOrLogin(page, `${viewportLabel} userB`, userB.email, userB.password);
  await verifyUserBNoLeak(page, `${viewportLabel} userB-no-leak`, summaryA, formA);
  const { summary: summaryB } = await saveProfile(page, `${viewportLabel} userB-save`, {
    residenceIndex: 4,
    activity1Index: 5,
    activity2Index: 6,
    categoryIndex: 1,
    spendRangeLabel: "5만 원대",
  });
  const summaryBReload = await reloadAndGetSummary(page, `${viewportLabel} userB-reload`);
  assertSummaryEquals(summaryBReload, summaryB, `${viewportLabel} userB reload`);

  // Logout B
  await logout(page, `${viewportLabel} userB-logout`);

  // User A re-login: A data intact, B data not visible
  await signupOrLogin(page, `${viewportLabel} userA-relogin`, userA.email, userA.password);
  const summaryA2 = await reloadAndGetSummary(page, `${viewportLabel} userA-relogin-reload`);
  assertSummaryEquals(summaryA2, summaryA, `${viewportLabel} userA re-login persist`);
  assertSummaryDiffers(summaryA2, summaryB, `${viewportLabel} userA no B leak`);

  const formA2 = await getFormSelection(page);
  if (formA.residenceId && formA2.residenceId !== formA.residenceId) {
    throw new Error(`${viewportLabel}: A residence id changed after B save`);
  }
  console.log(`PASS: ${viewportLabel} — A form ids unchanged after B isolation`);

  await logout(page, `${viewportLabel} userA-final-logout`);
  await verifyAnonymousSaveBlocked(page, `${viewportLabel} final-anon-block`);

  console.log(`PASS: ${viewportLabel} — full A/B RLS isolation flow`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  await page.setViewportSize({ width: 390, height: 844 });
  await runCrossUserFlow(page, "mobile-390");

  await page.setViewportSize({ width: 1280, height: 800 });
  await runCrossUserFlow(page, "desktop-1280");

  await verifyDiagnostics(page);

  console.log(
    "\nINFO: payload tampering — not executed (UI does not expose cross-user profile id; A/B visible isolation verified)",
  );
  console.log("\nStage 1-C-R2 Production RLS verification PASSED");
} finally {
  await browser.close();
}
