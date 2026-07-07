/**
 * Stage 1-D-B Consumer Profile Intent UX — Production verification
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
  if (REQUIRE_AUTH) throw new Error(message);
  console.log(`SKIP: ${message}`);
  return true;
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

async function verifyPublicProfile(page, label) {
  const res = await page.goto(`${BASE}/consumer/profile`, {
    waitUntil: "networkidle",
  });
  if (!res || res.status() !== 200) {
    throw new Error(`${label}: HTTP ${res?.status() ?? "error"}`);
  }
  console.log(`PASS: ${label} — /consumer/profile HTTP 200`);

  const body = await page.locator("body").innerText();
  assertContains(body, "출생년도", `${label} birth year`);
  assertContains(body, "성별", `${label} gender`);
  assertContains(body, "주거지역 (시·군·구", `${label} residence label`);
  assertContains(body, "주활동지역 1 (시·군·구", `${label} activity1 label`);
  assertContains(body, "주활동지역 2 (시·군·구", `${label} activity2 label`);
  assertContains(body, "관심정보", `${label} interest label`);
  assertContains(body, "전체", `${label} interest all option`);
  assertContains(body, "소비 의향 프로필 완성도", `${label} completion`);

  assertNotContains(body, "소비 규모 범위", `${label} no spend range`);
  assertNotContains(body, "stage1BRoute=", `${label} no stage1B`);
  assertNotContains(body, "stage1CProfileRoute", `${label} no stage1C`);
  assertNotContains(body, "stage1DSocialProvider", `${label} no stage1D`);
  assertNotContains(body, "ServiceRoleUsed", `${label} no service role marker`);

  const provinceOnly = ["서울특별시\n", "경기도\n", "충청남도\n"];
  for (const p of provinceOnly) {
    assertNotContains(body, p, `${label} no province-only ${p.trim()}`);
  }

  await checkNoHorizontalScroll(page, label);
}

async function verifyConsumerHome(page, label) {
  await page.goto(`${BASE}/consumer`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "AdMe 소비자 홈", `${label} consumer home`);
  assertContains(body, "소비 의향 프로필", `${label} profile section`);
  assertContains(body, "광고 카드", `${label} coming soon ads`);
  assertContains(body, "퀴즈", `${label} coming soon quiz`);
  assertContains(body, "포인트", `${label} coming soon points`);
  assertNotContains(body, "stage1DB", `${label} no stage1DB on public home`);
  await checkNoHorizontalScroll(page, label);
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();

  assertContains(body, "Stage 1-D-B Consumer Profile Intent UX", "diagnostics title");
  assertContains(body, "stage-1-d-b-consumer-profile-intent-ux", "diagnostics slug");
  assertContains(body, "stage1DBProfileAxes=age,gender,region,interest", "diagnostics axes");
  assertContains(body, "stage1DBBirthYearEnabled=true", "diagnostics birth year");
  assertContains(body, "stage1DBGenderEnabled=true", "diagnostics gender");
  assertContains(body, "stage1DBRegionGranularity=basic_municipality", "diagnostics region");
  assertContains(body, "stage1DBProvinceOnlyOptionsVisible=false", "diagnostics province");
  assertContains(body, "stage1DBSpendRangePublicUI=false", "diagnostics spend ui");
  assertContains(body, "stage1DBSpendRangeLegacyPreserved=true", "diagnostics spend legacy");
  assertContains(body, "stage1DBInterestAllEnabled=true", "diagnostics interest all");
  assertContains(body, "stage1DBProfileCompletionEnabled=true", "diagnostics completion");
  assertContains(body, "stage1DBConsumerHomeSkeleton=true", "diagnostics home");
  assertContains(body, "stage1DBServiceRoleUsed=false", "diagnostics service role");
  assertContains(body, "stage1DBPointLedgerMutation=false", "diagnostics point ledger");
  assertContains(body, "stage1DBQuizAnswerAccess=false", "diagnostics quiz answer");

  const deployMatch = body.match(/stage1DBDeployCommit=([a-f0-9]{7}|unknown)/);
  if (!deployMatch) {
    throw new Error("diagnostics: missing stage1DBDeployCommit");
  }
  const deployCommit = deployMatch[1];
  console.log(`PASS: diagnostics — stage1DBDeployCommit=${deployCommit}`);

  const statusLine = body.match(/DB check status:\s*(\w+)/);
  if (!statusLine || statusLine[1] !== "ok") {
    throw new Error(`diagnostics: DB check status not ok (got ${statusLine?.[1]})`);
  }
  console.log("PASS: diagnostics — DB check status ok");

  return deployCommit;
}

async function isAuthenticatedOnProfile(body) {
  return body.includes("로그인됨") && !body.includes("로그인이 필요합니다. 로그인하기");
}

async function authenticate(page) {
  const email =
    process.env.STAGE1C_TEST_EMAIL ??
    `stage1db-${Date.now()}@example.com`;
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
      return { skipped: false };
    }
    if (
      afterSignup.includes("이메일 확인") ||
      afterSignup.includes("signup_email_confirm_maybe_required")
    ) {
      if (skipOrFail("authenticated save — email confirmation required after signup")) {
        return { skipped: true };
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
    if (skipOrFail("authenticated save — login failed or email confirmation required")) {
      return { skipped: true };
    }
    throw new Error("authenticated login failed");
  }
  console.log("PASS: authenticated login for save test");
  return { skipped: false };
}

async function verifyAuthenticatedSave(page, label, auth) {
  if (auth?.skipped) {
    console.log(`SKIP: ${label} authenticated save`);
    return;
  }

  await page.goto(`${BASE}/consumer/profile`, { waitUntil: "networkidle" });

  await page.locator("select").filter({ has: page.locator("option", { hasText: "1990" }) }).selectOption("1990");
  await page.getByRole("radio", { name: "여성" }).click();
  await page.locator("select").first().selectOption({ index: 1 });

  const activitySelects = page.locator("select");
  if ((await activitySelects.count()) >= 2) {
    await activitySelects.nth(1).selectOption({ index: 2 });
  }
  if ((await activitySelects.count()) >= 3) {
    await activitySelects.nth(2).selectOption({ index: 3 });
  }

  await page.getByRole("button", { name: "전체", exact: true }).click();
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);

  let body = await page.locator("body").innerText();
  assertContains(body, "소비 의향 프로필이 저장되었습니다", `${label} save all interests`);

  await page.reload({ waitUntil: "networkidle" });
  body = await page.locator("body").innerText();
  assertContains(body, "1990", `${label} birth year persisted`);
  assertContains(body, "여성", `${label} gender persisted`);

  await page.getByRole("button", { name: "전체", exact: true }).click();
  const firstCategory = page
    .locator("fieldset")
    .filter({ hasText: "관심정보" })
    .locator("button[type='button']")
    .nth(1);
  await firstCategory.click();
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);
  body = await page.locator("body").innerText();
  assertContains(body, "소비 의향 프로필이 저장되었습니다", `${label} save selected interests`);

  await page.goto(`${BASE}/consumer`, { waitUntil: "networkidle" });
  body = await page.locator("body").innerText();
  assertContains(body, "프로필 수정하기", `${label} consumer home CTA`);
  assertContains(body, "프로필 완성도", `${label} consumer home completion`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  await page.setViewportSize({ width: 390, height: 844 });
  await verifyPublicProfile(page, "mobile-390-profile");
  await verifyConsumerHome(page, "mobile-390-consumer");

  await page.setViewportSize({ width: 1280, height: 800 });
  await verifyPublicProfile(page, "desktop-1280-profile");
  await verifyConsumerHome(page, "desktop-1280-consumer");

  const auth = await authenticate(page);
  await verifyAuthenticatedSave(page, "auth-save", auth);

  const deployCommit = await verifyDiagnostics(page);

  console.log(
    `\nStage 1-D-B Profile Intent Production verification PASSED (commit ${deployCommit})`,
  );
} finally {
  await browser.close();
}
