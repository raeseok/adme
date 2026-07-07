/**
 * Stage 1-E-R — Production RLS A/B isolation with hierarchical region selectors
 *
 * Env:
 *   ADME_E2E_BASE_URL (default https://web-ashen-xi-52.vercel.app)
 *   ADME_TEST_EMAIL_A, ADME_TEST_PASSWORD_A
 *   ADME_TEST_EMAIL_B, ADME_TEST_PASSWORD_B
 */
import { chromium } from "playwright";
import {
  getProfileFormSnapshot,
  REGION_SELECTOR_IDS,
  selectRegionHierarchy,
  assertRegionSnapshotEquals,
  assertRegionSnapshotDiffers,
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

async function saveUserProfile(page, label, profile) {
  await gotoProfile(page, BASE);
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} authenticated`);

  await page.getByRole("group", { name: "출생년도" }).locator("select").selectOption(profile.birthYear);
  await page.getByRole("radio", { name: profile.genderLabel }).click();

  await selectRegionHierarchy(page, REGION_SELECTOR_IDS.residence, profile.residence);
  if (profile.activity1) {
    await selectRegionHierarchy(page, REGION_SELECTOR_IDS.activity1, profile.activity1);
  }
  if (profile.activity2) {
    await selectRegionHierarchy(page, REGION_SELECTOR_IDS.activity2, profile.activity2);
  }

  if (profile.useAllInterests) {
    await page.getByRole("button", { name: "전체", exact: true }).click();
  } else {
    const categoryButtons = page
      .locator("fieldset")
      .filter({ hasText: "관심정보" })
      .locator("button[type='button']");
    await categoryButtons.nth(profile.categoryIndex ?? 1).click();
  }

  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
  await page.waitForTimeout(4000);

  const after = await page.locator("body").innerText();
  assertContains(after, "소비 의향 프로필이 저장되었습니다", `${label} save`);

  return getProfileFormSnapshot(page);
}

async function verifyUserBNoLeak(page, label, snapshotA) {
  await gotoProfile(page, BASE);
  const body = await page.locator("body").innerText();
  assertContains(body, "로그인됨", `${label} B authenticated`);
  assertContains(body, "***@", `${label} B email masked`);

  const snapshotB = await getProfileFormSnapshot(page);
  assertRegionSnapshotDiffers(snapshotB.residence, snapshotA.residence, `${label} region isolation`);

  if (snapshotB.residence.sigunguValue) {
    throw new Error(`${label}: B should have empty residence before save`);
  }
  console.log(`PASS: ${label} — B residence empty before save`);

  if (snapshotB.categoryCount > 0 || snapshotB.interestAll) {
    throw new Error(`${label}: B should have no interest selection before save`);
  }
  console.log(`PASS: ${label} — B no pre-selected interests`);

  return snapshotB;
}

async function runAbFlow(page, viewportLabel) {
  const profileA = {
    birthYear: "1988",
    genderLabel: "남성",
    residence: { sido: "서울특별시", sigungu: "강남구" },
    activity1: { sido: "서울특별시", sigungu: "송파구" },
    activity2: { sido: "서울특별시", sigungu: "마포구" },
    categoryIndex: 1,
  };

  const profileB = {
    birthYear: "1995",
    genderLabel: "여성",
    residence: { sido: "서울특별시", sigungu: "종로구" },
    activity1: { sido: "경기도", sigungu: "고양시", dong: "덕양구" },
    activity2: { sido: "경기도", sigungu: "고양시", dong: "일산동구" },
    useAllInterests: true,
  };

  const { userA, userB } = resolveTestCredentials();

  console.log(`\n=== ${viewportLabel} A/B RLS flow ===`);

  await authenticateUser(page, BASE, `${viewportLabel} User A login`, userA.email, userA.password);
  const snapshotA = await saveUserProfile(page, `${viewportLabel} User A save`, profileA);

  await page.reload({ waitUntil: "networkidle" });
  const snapshotAReload = await getProfileFormSnapshot(page);
  assertRegionSnapshotEquals(snapshotAReload.residence, snapshotA.residence, `${viewportLabel} User A residence reload`);
  console.log(`PASS: ${viewportLabel} User A — reload persistence`);

  await logoutFromProfile(page, BASE, `${viewportLabel} User A logout`);
  await verifyAnonymousSaveBlocked(page, `${viewportLabel} anon block`);

  await authenticateUser(page, BASE, `${viewportLabel} User B login`, userB.email, userB.password);
  await verifyUserBNoLeak(page, `${viewportLabel} User B no leak`, snapshotA);
  const snapshotB = await saveUserProfile(page, `${viewportLabel} User B save`, profileB);

  await page.reload({ waitUntil: "networkidle" });
  const snapshotBReload = await getProfileFormSnapshot(page);
  assertRegionSnapshotEquals(snapshotBReload.residence, snapshotB.residence, `${viewportLabel} User B residence reload`);

  await logoutFromProfile(page, BASE, `${viewportLabel} User B logout`);

  await authenticateUser(page, BASE, `${viewportLabel} User A relogin`, userA.email, userA.password);
  const snapshotA2 = await getProfileFormSnapshot(page);
  assertRegionSnapshotEquals(snapshotA2.residence, snapshotA.residence, `${viewportLabel} User A re-login`);
  assertRegionSnapshotDiffers(snapshotA2.residence, snapshotB.residence, `${viewportLabel} User A no B leak`);
  console.log(`PASS: ${viewportLabel} — full A/B RLS isolation`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  await page.setViewportSize({ width: 390, height: 844 });
  await runAbFlow(page, "mobile-390");

  await page.setViewportSize({ width: 1440, height: 900 });
  await runAbFlow(page, "desktop-1440");

  console.log("\nStage 1-E-R RLS A/B verification PASSED");
} finally {
  await browser.close();
}
