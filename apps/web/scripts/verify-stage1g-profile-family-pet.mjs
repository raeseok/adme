/**
 * Stage 1-G — child birth year & pet condition profile save/load + DB schema
 */
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";
import {
  REGION_SELECTOR_IDS,
  selectRegionHierarchy,
} from "./e2e/region-hierarchy-helpers.mjs";
import {
  authenticateUser,
  gotoProfile,
} from "./e2e/auth-helpers.mjs";
import {
  createAnonSupabaseClient,
  createEphemeralSupabaseSession,
} from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

async function probeSchema(client) {
  const probe = await client
    .from("consumer_profiles")
    .select(
      "oldest_child_birth_year, youngest_child_birth_year, pet_types",
    )
    .limit(0);
  if (probe.error?.message?.includes("oldest_child_birth_year")) {
    throw new Error(
      "consumer_profiles.oldest_child_birth_year missing — apply Stage 1-G migration",
    );
  }
  if (probe.error?.message?.includes("youngest_child_birth_year")) {
    throw new Error(
      "consumer_profiles.youngest_child_birth_year missing — apply Stage 1-G migration",
    );
  }
  if (probe.error?.message?.includes("pet_types")) {
    throw new Error("consumer_profiles.pet_types missing — apply Stage 1-G migration");
  }
  console.log("PASS: schema — child/pet columns exist");
}

async function selectChildBirthYear(page, legend, year) {
  const fieldset = page.getByRole("group", { name: legend });
  const select = fieldset.locator("select");
  if (year == null) {
    await select.selectOption("");
  } else {
    await select.selectOption(String(year));
  }
}

async function getChildBirthYear(page, legend) {
  const fieldset = page.getByRole("group", { name: legend });
  const value = await fieldset.locator("select").inputValue();
  return value ? Number(value) : null;
}

async function setPetTypes(page, labels) {
  for (const label of ["강아지", "고양이", "기타"]) {
    const checkbox = page.getByRole("checkbox", { name: label });
    const shouldCheck = labels.includes(label);
    const checked = await checkbox.isChecked();
    if (checked !== shouldCheck) {
      await checkbox.click();
    }
  }
}

async function getCheckedPetLabels(page) {
  const labels = [];
  for (const label of ["강아지", "고양이", "기타"]) {
    if (await page.getByRole("checkbox", { name: label }).isChecked()) {
      labels.push(label);
    }
  }
  return labels;
}

async function ensureMinimalProfileReady(page) {
  const residence = page.getByTestId("region-selector-residence");
  const sigungu = residence.getByTestId("region-selector-residence-sigungu");
  const sigunguValue = await sigungu.inputValue();
  if (!sigunguValue) {
    await selectRegionHierarchy(page, REGION_SELECTOR_IDS.residence, {
      sido: "서울특별시",
      sigungu: "강남구",
    });
  }

  const allBtn = page.getByRole("button", { name: "전체", exact: true });
  const className = await allBtn.getAttribute("class");
  if (!className?.includes("bg-blue-600")) {
    await allBtn.click();
  }
}

async function saveMinimalProfile(page, label) {
  await ensureMinimalProfileReady(page);
  await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const body = await page.locator("body").innerText();
    if (body.includes("소비 의향 프로필이 저장되었습니다")) {
      console.log(`PASS: ${label} — profile saved`);
      return;
    }
    if (body.includes("가장 큰 자녀 생년은 막내 자녀 생년보다 늦을 수 없습니다")) {
      console.log(`PASS: ${label} — invalid child order blocked`);
      return "invalid_blocked";
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`${label}: save timeout`);
}

async function main() {
  const ts = Date.now();
  const nonce = randomBytes(4).toString("hex");
  const email = `stage1g-family-${ts}-${nonce}@example.com`;
  const password = randomBytes(16).toString("base64url");

  const session = await createEphemeralSupabaseSession(email, password, BASE);
  const client = await createAnonSupabaseClient(BASE);
  await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  await probeSchema(client);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await authenticateUser(page, BASE, "Stage 1-G profile", email, password);
    await gotoProfile(page, BASE);

    const body = await page.locator("body").innerText();
    assertContains(body, "가장 큰 자녀 생년", "profile fields");
    assertContains(body, "막내 자녀 생년", "profile fields");
    assertContains(body, "반려동물 조건", "profile fields");

    await selectChildBirthYear(page, "가장 큰 자녀 생년", null);
    await selectChildBirthYear(page, "막내 자녀 생년", null);
    await setPetTypes(page, []);
    await saveMinimalProfile(page, "null child + empty pets");

    await page.reload({ waitUntil: "networkidle" });
    if ((await getChildBirthYear(page, "가장 큰 자녀 생년")) != null) {
      throw new Error("reload: oldest child should be empty");
    }
    if ((await getChildBirthYear(page, "막내 자녀 생년")) != null) {
      throw new Error("reload: youngest child should be empty");
    }
    if ((await getCheckedPetLabels(page)).length > 0) {
      throw new Error("reload: pet types should be empty");
    }
    console.log("PASS: reload — null/null child and empty pets persisted");

    await selectChildBirthYear(page, "가장 큰 자녀 생년", 2012);
    await selectChildBirthYear(page, "막내 자녀 생년", 2016);
    await setPetTypes(page, ["강아지", "고양이"]);
    await saveMinimalProfile(page, "valid child + dog/cat");

    await page.reload({ waitUntil: "networkidle" });
    if ((await getChildBirthYear(page, "가장 큰 자녀 생년")) !== 2012) {
      throw new Error("reload: oldest child 2012 missing");
    }
    if ((await getChildBirthYear(page, "막내 자녀 생년")) !== 2016) {
      throw new Error("reload: youngest child 2016 missing");
    }
    const pets = await getCheckedPetLabels(page);
    if (!pets.includes("강아지") || !pets.includes("고양이")) {
      throw new Error(`reload: dog/cat missing — got ${pets.join(",")}`);
    }
    console.log("PASS: reload — 2012/2016 and dog/cat persisted");

    await setPetTypes(page, ["기타"]);
    await saveMinimalProfile(page, "other pet only");
    await page.reload({ waitUntil: "networkidle" });
    const otherOnly = await getCheckedPetLabels(page);
    if (otherOnly.length !== 1 || otherOnly[0] !== "기타") {
      throw new Error(`reload: other pet only expected, got ${otherOnly.join(",")}`);
    }
    console.log("PASS: reload — other pet persisted");

    await selectChildBirthYear(page, "가장 큰 자녀 생년", 2018);
    await selectChildBirthYear(page, "막내 자녀 생년", 2014);
    await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
    await page.waitForTimeout(2000);
    const invalidBody = await page.locator("body").innerText();
    assertContains(
      invalidBody,
      "가장 큰 자녀 생년은 막내 자녀 생년보다 늦을 수 없습니다",
      "invalid child order UI",
    );

    const { data: profileRow } = await client
      .from("consumer_profiles")
      .select("oldest_child_birth_year, youngest_child_birth_year, pet_types")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profileRow) {
      throw new Error("DB: consumer profile row missing");
    }
    if (profileRow.oldest_child_birth_year === 2018 && profileRow.youngest_child_birth_year === 2014) {
      throw new Error("DB: invalid child order was stored");
    }
    console.log("PASS: DB — invalid child order not stored");

    const invalidDb = await client
      .from("consumer_profiles")
      .update({
        oldest_child_birth_year: 2018,
        youngest_child_birth_year: 2014,
      })
      .eq("user_id", session.user.id);
    if (!invalidDb.error) {
      throw new Error("DB: child order constraint should block 2018/2014");
    }
    console.log("PASS: DB — child birth year order constraint enforced");

    const invalidPet = await client
      .from("consumer_profiles")
      .update({ pet_types: ["bird"] })
      .eq("user_id", session.user.id);
    if (!invalidPet.error) {
      throw new Error("DB: pet_types constraint should block bird");
    }
    console.log("PASS: DB — pet_types allowed value constraint enforced");

    console.log("PASS: verify:stage1g-profile-family-pet");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
