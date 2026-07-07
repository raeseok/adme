/**
 * Stage 1-E-R — Production authenticated region save/reload + viewport verification
 *
 * Env:
 *   ADME_E2E_BASE_URL (default https://web-ashen-xi-52.vercel.app)
 *   ADME_TEST_EMAIL_A, ADME_TEST_PASSWORD_A — required for auth flow
 */
import { chromium } from "playwright";
import {
  getProfileFormSnapshot,
  REGION_SELECTOR_IDS,
  selectRegionHierarchy,
  selectSidoOnly,
  verifyHierarchicalProfileVisible,
  assertNoStageMarkers,
  assertRegionSnapshotEquals,
  checkNoHorizontalScroll,
} from "./e2e/region-hierarchy-helpers.mjs";
import {
  gotoProfile,
  resolveTestCredentials,
  authenticateUser,
  logoutFromProfile,
  verifyAnonymousSaveBlocked,
} from "./e2e/auth-helpers.mjs";

const BASE = process.env.ADME_E2E_BASE_URL ?? "https://web-ashen-xi-52.vercel.app";

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

async function verifyPublicRoutes(page, label) {
  for (const path of ["/", "/consumer", "/consumer/profile", "/auth/login"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await assertNoStageMarkers(page, `${label} ${path}`);
  }
}

async function verifyDiagnosticsStage1E(page, label) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  const markers = [
    "Stage 1-E-R Region Auth Verification",
    "stage-1-e-r-region-auth-verification",
    "stage1ERRlsABSelectorUpdated=true",
    "stage1ERMobileViewportChecked=true",
    "stage1ERDesktopViewportChecked=true",
    "Stage 1-E Region Hierarchical Selector",
    "stage-1-e-region-hierarchical-selector",
    "stage1ERegionSelectorDepth=sido-sigungu-dong-optional",
    "stage1ESidoFirst=true",
    "stage1ESigunguSecond=true",
    "stage1EDongOptional=true",
    "stage1ERegionFinalSaveLevel=sigungu-or-dong",
    "stage1ERegionSeedCoverage=full",
    "stage1EAdvertiserPrecisionPrepared=true",
    "stage1EPublicDebugMarker=false",
    "stage1EServiceRoleUsed=false",
    "stage1EPointLedgerMutation=false",
    "stage1EQuizAnswerAccess=false",
  ];
  for (const m of markers) {
    assertContains(body, m, `${label} diagnostics`);
  }
}

async function verifySidoOnlyIncomplete(page, label) {
  await gotoProfile(page, BASE);
  await page.getByRole("group", { name: "출생년도" }).locator("select").selectOption("1990");
  await page.getByRole("radio", { name: "응답하지 않음" }).click();
  await selectSidoOnly(page, REGION_SELECTOR_IDS.residence, "서울특별시");
  await page.getByRole("button", { name: "전체", exact: true }).click();

  const completion = await getProfileFormSnapshot(page);
  if (completion.completionPercent === 100) {
    throw new Error(`${label}: sido-only should not complete region axis`);
  }

  const body = await page.locator("body").innerText();
  assertContains(body, "주거지역", `${label} sido-only remaining`);

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(2500);
  const afterSave = await page.locator("body").innerText();
  assertContains(afterSave, "주거지역", `${label} sido-only save blocked`);
  console.log(`PASS: ${label} — sido-only not region-complete`);
}

async function saveFullProfile(page, label) {
  await gotoProfile(page, BASE);

  await page.getByRole("group", { name: "출생년도" }).locator("select").selectOption("1990");
  await page.getByRole("radio", { name: "응답하지 않음" }).click();

  await selectRegionHierarchy(page, REGION_SELECTOR_IDS.residence, {
    sido: "서울특별시",
    sigungu: "강남구",
  });

  const residenceBody = await page.locator("body").innerText();
  assertContains(
    residenceBody,
    "이 지역은 현재 시·군·구 단위까지 선택할 수 있습니다.",
    `${label} sigungu-only hint`,
  );

  await selectRegionHierarchy(page, REGION_SELECTOR_IDS.activity1, {
    sido: "경기도",
    sigungu: "고양시",
    dong: "일산동구",
  });

  await selectRegionHierarchy(page, REGION_SELECTOR_IDS.activity2, {
    sido: "서울특별시",
    sigungu: "종로구",
  });

  await page.getByRole("button", { name: "전체", exact: true }).click();
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);

  const body = await page.locator("body").innerText();
  assertContains(body, "소비 의향 프로필이 저장되었습니다", `${label} save`);
  assertNotContains(body, "소비 규모 범위", `${label} no spend range`);

  const snapshot = await getProfileFormSnapshot(page);
  if (snapshot.completionPercent !== 100) {
    throw new Error(`${label}: expected 100% completion, got ${snapshot.completionPercent}%`);
  }
  console.log(`PASS: ${label} — completion 100%`);

  return snapshot;
}

async function verifyViewportProfile(page, viewportLabel, width, height) {
  await page.setViewportSize({ width, height });
  await gotoProfile(page, BASE);
  await verifyHierarchicalProfileVisible(page, `${viewportLabel} profile`);
  await checkNoHorizontalScroll(page, `${viewportLabel} profile`);
  console.log(`PASS: ${viewportLabel} — viewport ${width}x${height}`);
}

const { userA } = resolveTestCredentials();

const browser = await chromium.launch();
let authPassed = false;
let mobileViewportPassed = false;
let desktopViewportPassed = false;

try {
  const page = await browser.newPage();

  await verifyPublicRoutes(page, "public");

  await verifyViewportProfile(page, "mobile", 390, 844);
  mobileViewportPassed = true;

  await verifyViewportProfile(page, "desktop", 1440, 900);
  desktopViewportPassed = true;

  await verifyDiagnosticsStage1E(page, "desktop");

  await authenticateUser(page, BASE, "User A login", userA.email, userA.password);

  await verifySidoOnlyIncomplete(page, "User A sido-only");
  const saved = await saveFullProfile(page, "User A save");

  await page.reload({ waitUntil: "networkidle" });
  const reloaded = await getProfileFormSnapshot(page);
  assertRegionSnapshotEquals(reloaded.residence, saved.residence, "User A residence reload");
  assertRegionSnapshotEquals(reloaded.activity1, saved.activity1, "User A activity1 reload");
  assertRegionSnapshotEquals(reloaded.activity2, saved.activity2, "User A activity2 reload");

  if (reloaded.birthYear !== saved.birthYear || reloaded.gender !== saved.gender) {
    throw new Error("User A reload: birth year or gender mismatch");
  }
  if (reloaded.completionPercent !== 100) {
    throw new Error(`User A reload: completion ${reloaded.completionPercent}%`);
  }
  console.log("PASS: User A — full profile reload persistence");

  await logoutFromProfile(page, BASE, "User A logout");
  await verifyAnonymousSaveBlocked(page, "anonymous save");

  authPassed = true;
  console.log("\nStage 1-E-R2 region auth verification PASSED");
} finally {
  await browser.close();
}

if (!authPassed) {
  process.exit(1);
}

if (mobileViewportPassed && desktopViewportPassed) {
  console.log("INFO: viewport checks PASSED (mobile 390x844, desktop 1440x900)");
}
