/**
 * Stage 1-F-R — Production UI smoke (MOIS canonical selector)
 */
import { chromium, devices } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REGION_SELECTOR_IDS,
  selectRegionHierarchy,
  selectSidoOnly,
  getProfileFormSnapshot,
  assertNoStageMarkers,
} from "./e2e/region-hierarchy-helpers.mjs";
import {
  resolveTestCredentials,
  authenticateUser,
  gotoProfile,
} from "./e2e/auth-helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.ADME_E2E_BASE_URL ?? "https://web-ashen-xi-52.vercel.app";

async function verifyViewport(page, label) {
  await gotoProfile(page, BASE);
  const sidoSelect = page.getByTestId(`${REGION_SELECTOR_IDS.residence}-sido`);
  const options = await sidoSelect.locator("option").allTextContents();
  const count = options.filter((o) => o && !o.includes("선택")).length;
  if (count < 16) throw new Error(`${label}: expected 16+ canonical sido options`);
  if (count > 20) {
    throw new Error(`${label}: too many sido options (${count}) — molit/legal duplicate leak`);
  }
  if (!options.some((o) => o.includes("전남광주통합특별시"))) {
    throw new Error(`${label}: 전남광주통합특별시 missing from sido options`);
  }
  if (options.some((o) => o === "광주광역시" || o === "전라남도")) {
    throw new Error(`${label}: legacy 광주/전남 should not appear in canonical selector`);
  }
  console.log(`PASS: ${label} — canonical sido options (${count})`);
}

async function main() {
  const testManifest = JSON.parse(
    await readFile(path.join(__dirname, "regions/source/stage1f-r-test-manifest.json"), "utf8"),
  );

  const browser = await chromium.launch({ headless: true });
  const creds = resolveTestCredentials();

  for (const [label, viewport, userKey] of [
    ["mobile-390", devices["Pixel 5"].viewport, "userA"],
    ["desktop-1440", { width: 1440, height: 900 }, "userB"],
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const user = creds[userKey];
    await authenticateUser(page, BASE, "Stage1FR", user.email, user.password);
    await verifyViewport(page, label);

    await gotoProfile(page, BASE);
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="region-selector-residence-sido"]');
      return el instanceof HTMLSelectElement && el.options.length > 16;
    }, { timeout: 20000 });
    await page.getByRole("group", { name: "출생년도" }).locator("select").selectOption("1992");
    await page.getByRole("radio", { name: "응답하지 않음" }).click();
    await selectRegionHierarchy(page, REGION_SELECTOR_IDS.residence, {
      sido: "서울특별시",
      sigungu: "강남구",
    });
    await page.getByRole("button", { name: "전체", exact: true }).click();
    await page.getByRole("button", { name: "소비 의향 프로필 저장" }).click();
    await page.waitForTimeout(4000);
    const saveBody = await page.locator("body").innerText();
    if (!saveBody.includes("소비 의향 프로필이 저장되었습니다")) {
      throw new Error(`${label}: save failed`);
    }
    await page.reload({ waitUntil: "networkidle" });
    const snap = await getProfileFormSnapshot(page);
    if (!snap.residence.sigunguLabel.includes("강남구")) {
      throw new Error(`${label}: residence reload failed`);
    }
    console.log(`PASS: ${label} — save/reload 서울 강남구`);

    await selectRegionHierarchy(page, REGION_SELECTOR_IDS.activity1, {
      sido: "경기도",
      sigungu: "안양시 만안구",
      dong: "명학동",
    });
    console.log(`PASS: ${label} — 안양시 명학동 (2026.7.1)`);

    await gotoProfile(page, BASE);
    await selectRegionHierarchy(page, REGION_SELECTOR_IDS.activity2, {
      sido: "전남광주통합특별시",
      sigungu: "목포시",
    });
    console.log(`PASS: ${label} — 전남광주통합특별시 > 목포시`);

    await gotoProfile(page, BASE);
    await selectSidoOnly(page, REGION_SELECTOR_IDS.residence, "서울특별시");
    const incomplete = await getProfileFormSnapshot(page);
    if (incomplete.completionPercent === 100) {
      throw new Error(`${label}: sido-only should be incomplete`);
    }
    console.log(`PASS: ${label} — sido-only incomplete`);

    await context.close();
  }

  const pubPage = await browser.newPage();
  for (const route of ["/", "/consumer"]) {
    await pubPage.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await assertNoStageMarkers(pubPage, route);
    const body = await pubPage.locator("body").innerText();
    if (body.includes("stage-1-f-r-mois-region-source-alignment")) {
      throw new Error(`public ${route} exposes stage1FR marker`);
    }
  }
  console.log("PASS: public marker check");
  console.log(`INFO: manifest jeonnam=${testManifest.testRegions?.jeonnamGwangju?.sido}`);
  await browser.close();
  console.log("PASS: smoke:stage1f-r-region-ui");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
