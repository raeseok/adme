/**
 * Playwright helpers for hierarchical RegionHierarchySelector (Stage 1-E+).
 * Uses data-testid on fieldsets/selects — not visible debug markers.
 */

export const REGION_SELECTOR_IDS = {
  residence: "region-selector-residence",
  activity1: "region-selector-activity-1",
  activity2: "region-selector-activity-2",
};

export function getRegionSelector(page, testId) {
  return page.getByTestId(testId);
}

export async function selectRegionHierarchy(page, testId, { sido, sigungu, dong }) {
  const root = getRegionSelector(page, testId);
  await root.getByTestId(`${testId}-sido`).selectOption({ label: sido });
  await root.getByTestId(`${testId}-sigungu`).selectOption({ label: sigungu });
  await page.waitForTimeout(400);
  const dongSelect = root.getByTestId(`${testId}-dong`);
  if (dong && (await dongSelect.count()) > 0) {
    await dongSelect.selectOption({ label: dong });
    return;
  }
  if ((await dongSelect.count()) > 0) {
    const labels = await dongSelect.locator("option").allTextContents();
    const pick = labels
      .map((s) => s.trim())
      .find((s) => s && s !== "선택 안 함" && !s.startsWith("선택"));
    if (pick) {
      await dongSelect.selectOption({ label: pick });
    }
  }
}

export async function selectSidoOnly(page, testId, sido) {
  const root = getRegionSelector(page, testId);
  await root.getByTestId(`${testId}-sido`).selectOption({ label: sido });
}

export async function getRegionHierarchyValues(page, testId) {
  const root = getRegionSelector(page, testId);
  const sidoSelect = root.getByTestId(`${testId}-sido`);
  const sigunguSelect = root.getByTestId(`${testId}-sigungu`);
  const dongSelect = root.getByTestId(`${testId}-dong`);

  const sidoOption = sidoSelect.locator("option:checked");
  const sigunguOption = sigunguSelect.locator("option:checked");
  const dongCount = await dongSelect.count();

  return {
    sidoValue: await sidoSelect.inputValue(),
    sidoLabel: (await sidoOption.textContent())?.trim() ?? "",
    sigunguValue: await sigunguSelect.inputValue(),
    sigunguLabel: (await sigunguOption.textContent())?.trim() ?? "",
    dongValue: dongCount > 0 ? await dongSelect.inputValue() : "",
    dongLabel:
      dongCount > 0
        ? ((await dongSelect.locator("option:checked").textContent())?.trim() ?? "")
        : "",
    hasDongSelect: dongCount > 0,
  };
}

export async function getBirthYearValue(page) {
  const select = page.getByRole("group", { name: "출생년도" }).locator("select");
  return select.inputValue();
}

export async function getGenderValue(page) {
  if ((await page.locator('input[name="gender"]:checked').count()) === 0) {
    return "";
  }
  return page.locator('input[name="gender"]:checked').inputValue();
}

export async function getCompletionPercent(page) {
  const body = await page.locator("body").innerText();
  const match = body.match(/소비 의향 프로필 완성도\s*(\d+)%/);
  return match ? Number(match[1]) : null;
}

export async function getProfileFormSnapshot(page) {
  const residence = await getRegionHierarchyValues(page, REGION_SELECTOR_IDS.residence);
  const activity1 = await getRegionHierarchyValues(page, REGION_SELECTOR_IDS.activity1);
  const activity2 = await getRegionHierarchyValues(page, REGION_SELECTOR_IDS.activity2);

  const interestAll =
    (await page.getByRole("button", { name: "전체", exact: true }).getAttribute("class"))?.includes(
      "bg-blue-600",
    ) ?? false;

  const categoryCount = await page
    .locator("fieldset")
    .filter({ hasText: "관심정보" })
    .locator("button.border-blue-600.bg-blue-600")
    .count();

  return {
    birthYear: await getBirthYearValue(page),
    gender: await getGenderValue(page),
    residence,
    activity1,
    activity2,
    completionPercent: await getCompletionPercent(page),
    interestAll,
    categoryCount,
  };
}

export function assertRegionSnapshotEquals(actual, expected, label) {
  for (const key of ["sidoLabel", "sigunguLabel", "dongLabel"]) {
    if (expected[key] && actual[key] !== expected[key]) {
      throw new Error(`${label}: ${key} expected "${expected[key]}" got "${actual[key]}"`);
    }
  }
  if (expected.sidoValue && actual.sidoValue !== expected.sidoValue) {
    throw new Error(`${label}: sidoValue mismatch`);
  }
  if (expected.sigunguValue && actual.sigunguValue !== expected.sigunguValue) {
    throw new Error(`${label}: sigunguValue mismatch`);
  }
  if (expected.dongValue && actual.dongValue !== expected.dongValue) {
    throw new Error(`${label}: dongValue mismatch`);
  }
  console.log(`PASS: ${label} — region snapshot matches`);
}

export function assertRegionSnapshotDiffers(actual, other, label) {
  const sameResidence =
    actual.sigunguValue &&
    other.sigunguValue &&
    actual.sidoValue === other.sidoValue &&
    actual.sigunguValue === other.sigunguValue &&
    actual.dongValue === other.dongValue;

  if (sameResidence) {
    throw new Error(`${label}: residence region leaked across users`);
  }

  console.log(`PASS: ${label} — no cross-user region leak detected`);
}

export async function checkNoHorizontalScroll(page, label) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollWidth > clientWidth + 1) {
    throw new Error(`${label}: horizontal scroll ${scrollWidth} > ${clientWidth}`);
  }
  console.log(`PASS: ${label} — no horizontal scroll`);
}

export async function verifyHierarchicalProfileVisible(page, label) {
  const body = await page.locator("body").innerText();
  for (const needle of [
    "주거지역",
    "주활동지역 1",
    "주활동지역 2",
    "먼저 시·도를 선택한 뒤 시·군·구를 선택해 주세요.",
    "전국 시·도, 시·군·구, 읍·면·동 단위까지 선택할 수 있습니다.",
  ]) {
    if (!body.includes(needle)) {
      throw new Error(`${label}: missing "${needle}"`);
    }
  }
  console.log(`PASS: ${label} — hierarchical profile UI visible`);
  await checkNoHorizontalScroll(page, label);
}

export async function assertNoStageMarkers(page, label) {
  const body = await page.locator("body").innerText();
  const forbidden = [
    "stage-1-f-region-seed-full-coverage",
    "stage-1-e-region-hierarchical-selector",
    "stage-1-e-r-region-auth-verification",
    "stage1FRegionSeedCoverage=",
    "stage1ERegionSelectorDepth=",
    "stage1ERAuthenticatedSaveReload=",
    "stage1ERRlsABSelectorUpdated=",
  ];
  for (const needle of forbidden) {
    if (body.includes(needle)) {
      throw new Error(`${label}: public page exposes "${needle}"`);
    }
  }
  console.log(`PASS: ${label} — no stage1E/stage1ER/stage1F visible markers`);
}
