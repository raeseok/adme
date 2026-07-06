/**
 * Stage 1-B-R Production verification (Playwright)
 * Usage: node scripts/verify-stage1b-production.mjs
 */
import { chromium } from "playwright";

const BASE = "https://web-ashen-xi-52.vercel.app";
const PROFILE = `${BASE}/consumer/profile`;

const REQUIRED_MARKERS_IDLE = [
  "Stage 1-B Consumer Profile UI",
  "stage-1-b-consumer-profile-ui",
  "stage1BRoute=/consumer/profile",
  "stage1BAuthIncluded=false",
  "stage1BAuthSeparatedTo=Stage 1-C",
  "stage1BWriteContract=auth-gated-server-action",
  "stage1BResidenceMax=1",
  "stage1BActivityMax=2",
  "stage1BUsesConsumerRegions=true",
  "stage1BRegionsEmpty=",
  "stage1BCategoriesEmpty=",
];

const REQUIRED_AFTER_SAVE = [
  "AUTH_REQUIRED",
  "stage1BSaveStatus=auth_required",
  "stage1BSaveBlockedByAuth=true",
  "stage1BMutationExecuted=false",
  "stage1BPointLedgerMutation=false",
  "stage1BQuizAnswerAccess=false",
];

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

async function verifyViewport(page, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(PROFILE, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();

  for (const marker of REQUIRED_MARKERS_IDLE) {
    assertContains(body, marker, `${name} idle marker`);
  }

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollWidth > clientWidth + 1) {
    throw new Error(`${name}: horizontal scroll detected (${scrollWidth} > ${clientWidth})`);
  }
  console.log(`PASS: ${name} — no horizontal scroll`);

  const saveBtn = page.getByRole("button", { name: "소비 의향 프로필 저장" });
  if (!(await saveBtn.isVisible())) {
    throw new Error(`${name}: save button not visible`);
  }
  console.log(`PASS: ${name} — save button visible`);

  await saveBtn.click();
  await page.waitForTimeout(2000);
  const afterSave = await page.locator("body").innerText();

  for (const marker of REQUIRED_AFTER_SAVE) {
    assertContains(afterSave, marker, `${name} after save`);
  }

  const commitMatch = afterSave.match(/stage1BDeployCommit=([a-f0-9]+)/);
  if (!commitMatch) {
    throw new Error(`${name}: stage1BDeployCommit not found`);
  }
  console.log(`PASS: ${name} — stage1BDeployCommit=${commitMatch[1]}`);

  return commitMatch[1];
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  assertContains(body, "DB check status", "diagnostics db label");
  if (!/\bok\b/.test(body)) {
    throw new Error("diagnostics: DB check status not ok");
  }
  console.log("PASS: diagnostics — DB check status ok");
  assertContains(body, "stage-0-5-vercel-shell", "diagnostics stage marker");
  assertContains(body, "Stage 0.5-R diagnostics verified", "diagnostics verified");
  console.log("PASS: diagnostics");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const mobileCommit = await verifyViewport(page, "mobile-390", 390, 844);
  const desktopCommit = await verifyViewport(page, "desktop-1280", 1280, 800);
  if (mobileCommit !== desktopCommit) {
    throw new Error(`deploy commit mismatch: ${mobileCommit} vs ${desktopCommit}`);
  }
  await verifyDiagnostics(page);
  console.log(`\nStage 1-B-R Production verification PASSED (commit ${mobileCommit})`);
} finally {
  await browser.close();
}
