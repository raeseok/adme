/**
 * Stage 3-D — smoke UI for reward preflight (mobile + desktop)
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3D_PREFLIGHT_REQUIRED,
  STAGE3D_PUBLIC_FORBIDDEN_MARKERS,
  assertContains,
  assertNotContains,
} from "./utils/stage3d-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

async function checkViewport(page, width, height, label) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}/admin/reward-preflight`, {
    waitUntil: "networkidle",
  });
  const body = await page.locator("body").innerText();
  for (const marker of [
    "stage3DProductionRewardOpenPreflight=true",
    "stage3DProductionRewardOpenReady=false",
    "stage3DProductionRewardMutation=false",
    "stage3DMutationBlockedByFlags=true",
    "stage3DKakaoSecretRawExposed=false",
  ]) {
    assertContains(body, marker, `${label} reward-preflight`);
  }

  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const diag = await page.locator("body").innerText();
  assertContains(
    diag,
    "stage3DProductionRewardOpenPreflight=true",
    `${label} diagnostics`,
  );

  await page.goto(`${BASE}/consumer/ads`, { waitUntil: "networkidle" });
  const ads = await page.locator("body").innerText();
  const adsHtml = await page.content();
  for (const marker of STAGE3D_PUBLIC_FORBIDDEN_MARKERS) {
    assertNotContains(ads, marker, `${label} ads body`);
    assertNotContains(adsHtml, marker, `${label} ads html`);
  }

  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const login = await page.locator("body").innerText();
  for (const marker of STAGE3D_PUBLIC_FORBIDDEN_MARKERS) {
    assertNotContains(login, marker, `${label} login`);
  }

  console.log(`PASS: ${label} viewport checks`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await checkViewport(page, 390, 844, "mobile");
    await checkViewport(page, 1440, 900, "desktop");

    await page.goto(`${BASE}/admin/reward-preflight`, {
      waitUntil: "networkidle",
    });
    const full = await page.locator("body").innerText();
    for (const marker of STAGE3D_PREFLIGHT_REQUIRED.slice(0, 15)) {
      assertContains(full, marker, "full preflight sample");
    }

    console.log("RESULT: mobileChecked=true");
    console.log("RESULT: desktopChecked=true");
    console.log("PASS: smoke:stage3d-reward-preflight-ui");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
