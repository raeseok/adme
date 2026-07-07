/**
 * Stage 1-C-R2 Production RLS cross-user isolation verification
 * @deprecated Use verify:stage1e-rls-ab for hierarchical region selectors (Stage 1-E-R).
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

async function getFormSnapshot(page) {
  const selects = page.locator("select");
  const selectCount = await selects.count();
  const birthYear = selectCount >= 1 ? await selects.nth(0).inputValue() : "";
  const residenceId = selectCount >= 2 ? await selects.nth(1).inputValue() : "";
  const activity1Id = selectCount >= 3 ? await selects.nth(2).inputValue() : "";
  const activity2Id = selectCount >= 4 ? await selects.nth(3).inputValue() : "";
  const gender =
    (await page.locator('input[name="gender"]:checked').count()) > 0
      ? await page.locator('input[name="gender"]:checked').inputValue()
      : "";
  const selectedCategories = page
    .locator("fieldset")
    .filter({ hasText: "관심정보" })
    .locator("button.border-blue-600.bg-blue-600");
  const categoryCount = await selectedCategories.count();
  const allInterests =
    (await page.getByRole("button", { name: "전체", exact: true }).getAttribute("class"))?.includes(
      "bg-blue-600",
    ) ?? false;

  return {
    birthYear,
    gender,
    residenceId,
    activity1Id,
    activity2Id,
    categoryCount,
    allInterests,
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

  body = await page.locator("body").innerText();
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
    birthYear = "1988",
    genderLabel = "남성",
    residenceIndex = 1,
    activity1Index = 2,
    activity2Index = 3,
    categoryIndex = 1,
    useAllInterests = false,
  } = opts;

  await gotoProfile(page);
  let body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} authenticated`);

  await page.locator("select").first().selectOption(birthYear);
  await page.getByRole("radio", { name: genderLabel }).click();

  const selects = page.locator("select");
  await selects.nth(1).selectOption({ index: residenceIndex });
  if ((await selects.count()) >= 3) {
    await selects.nth(2).selectOption({ index: activity1Index });
  }
  if ((await selects.count()) >= 4) {
    await selects.nth(3).selectOption({ index: activity2Index });
  }

  if (useAllInterests) {
    await page.getByRole("button", { name: "전체", exact: true }).click();
  } else {
    const categoryButtons = page
      .locator("fieldset")
      .filter({ hasText: "관심정보" })
      .locator("button[type='button']");
    await categoryButtons.nth(categoryIndex).click();
  }

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);

  body = await page.locator("body").innerText();
  assertContains(body, "소비 의향 프로필이 저장되었습니다", `${label} save saved`);

  const snapshot = await getFormSnapshot(page);
  return { snapshot };
}

async function reloadAndGetSnapshot(page, label) {
  await page.reload({ waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} reload auth`);
  return getFormSnapshot(page);
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
}

function assertSnapshotEquals(actual, expected, label) {
  for (const key of ["birthYear", "gender", "residenceId", "activity1Id", "activity2Id"]) {
    if (expected[key] && actual[key] !== expected[key]) {
      throw new Error(
        `${label}: ${key} expected "${expected[key]}" got "${actual[key]}"`,
      );
    }
  }
  console.log(`PASS: ${label} — snapshot matches expected`);
}

function assertSnapshotDiffers(actual, other, label) {
  if (other.birthYear && actual.birthYear === other.birthYear) {
    throw new Error(`${label}: birthYear leaked — ${actual.birthYear}`);
  }
  if (other.gender && actual.gender === other.gender && other.birthYear === actual.birthYear) {
    throw new Error(`${label}: gender+birthYear combo leaked`);
  }
  if (
    other.residenceId &&
    actual.residenceId === other.residenceId
  ) {
    throw new Error(`${label}: residenceId leaked — ${actual.residenceId}`);
  }
  console.log(`PASS: ${label} — no cross-user snapshot leak detected`);
}

async function verifyUserBNoLeak(page, label, userASnapshot) {
  await gotoProfile(page);
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} B authenticated`);
  assertContains(body, "***@", `${label} B email masked`);

  const snapshot = await getFormSnapshot(page);
  assertSnapshotDiffers(snapshot, userASnapshot, `${label} snapshot isolation`);

  if (snapshot.residenceId) {
    throw new Error(`${label}: B should have empty residence, got ${snapshot.residenceId}`);
  }
  console.log(`PASS: ${label} — B residence empty`);

  if (snapshot.birthYear && userASnapshot.birthYear === snapshot.birthYear) {
    throw new Error(`${label}: B birthYear matches A`);
  }
  console.log(`PASS: ${label} — B form not A's birth year`);

  if (snapshot.categoryCount > 0 || snapshot.allInterests) {
    throw new Error(`${label}: B should have no interest selection`);
  }
  console.log(`PASS: ${label} — B no pre-selected interests`);

  return { snapshot };
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

  await signupOrLogin(page, `${viewportLabel} userA`, userA.email, userA.password);
  const { snapshot: snapshotA } = await saveProfile(page, `${viewportLabel} userA-save`, {
    birthYear: "1988",
    genderLabel: "남성",
    residenceIndex: 1,
    activity1Index: 2,
    activity2Index: 3,
    categoryIndex: 1,
  });
  const snapshotAReload = await reloadAndGetSnapshot(page, `${viewportLabel} userA-reload`);
  assertSnapshotEquals(snapshotAReload, snapshotA, `${viewportLabel} userA reload`);

  await logout(page, `${viewportLabel} userA-logout`);
  await verifyAnonymousSaveBlocked(page, `${viewportLabel} anon-block`);

  await signupOrLogin(page, `${viewportLabel} userB`, userB.email, userB.password);
  await verifyUserBNoLeak(page, `${viewportLabel} userB-no-leak`, snapshotA);
  const { snapshot: snapshotB } = await saveProfile(page, `${viewportLabel} userB-save`, {
    birthYear: "1995",
    genderLabel: "여성",
    residenceIndex: 4,
    activity1Index: 5,
    activity2Index: 6,
    categoryIndex: 2,
    useAllInterests: true,
  });
  const snapshotBReload = await reloadAndGetSnapshot(page, `${viewportLabel} userB-reload`);
  assertSnapshotEquals(snapshotBReload, snapshotB, `${viewportLabel} userB reload`);

  await logout(page, `${viewportLabel} userB-logout`);

  await signupOrLogin(page, `${viewportLabel} userA-relogin`, userA.email, userA.password);
  const snapshotA2 = await reloadAndGetSnapshot(page, `${viewportLabel} userA-relogin-reload`);
  assertSnapshotEquals(snapshotA2, snapshotA, `${viewportLabel} userA re-login persist`);
  assertSnapshotDiffers(snapshotA2, snapshotB, `${viewportLabel} userA no B leak`);

  if (snapshotA.residenceId && snapshotA2.residenceId !== snapshotA.residenceId) {
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
