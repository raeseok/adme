/**
 * Stage 1-F — Production UI smoke for national region selector
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

async function verifyViewport(page, label, viewport) {
  await page.setViewportSize(viewport);
  await gotoProfile(page, BASE);
  const body = await page.locator("body").innerText();
  if (!body.includes("주거지역")) throw new Error(`${label}: profile not visible`);
  const sidoSelect = page.getByTestId(`${REGION_SELECTOR_IDS.residence}-sido`);
  const options = await sidoSelect.locator("option").allTextContents();
  if (options.filter((o) => o && !o.includes("선택")).length < 17) {
    throw new Error(`${label}: expected 17+ sido options`);
  }
  console.log(`PASS: ${label} — national sido options visible`);
}

async function main() {
  const testManifest = JSON.parse(
    await readFile(
      path.join(__dirname, "regions/source/stage1f-test-manifest.json"),
      "utf8",
    ),
  );

  const browser = await chromium.launch({ headless: true });
  const creds = resolveTestCredentials();

  for (const [label, viewport] of [
    ["mobile-390", devices["Pixel 5"].viewport],
    ["desktop-1440", { width: 1440, height: 900 }],
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await authenticateUser(page, BASE, "Stage1F", creds.userA.email, creds.userA.password);
    await verifyViewport(page, label, viewport);

    await gotoProfile(page, BASE);
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="region-selector-residence-sido"]');
      return el instanceof HTMLSelectElement && el.options.length > 17;
    }, { timeout: 20000 });
    await page.getByRole("group", { name: "출생년도" }).locator("select").selectOption("1990");
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
      sigungu: "고양시",
    });
    console.log(`PASS: ${label} — 고양시 일산동구 dong optional`);

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
  }
  console.log("PASS: public marker check");

  console.log(`INFO: test manifest metro=${testManifest.testManifest?.metro?.code}`);
  await browser.close();
  console.log("PASS: smoke:stage1f-region-ui");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
