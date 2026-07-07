/**
 * Stage 1-D-A Public UI Production verification
 * - /auth/login and /consumer/profile must not expose stage1C/stage1D dev markers
 * - /admin/diagnostics must expose Stage 1-D-A verification markers
 */
import { chromium } from "playwright";

const BASE = "https://web-ashen-xi-52.vercel.app";

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

async function verifyPublicLogin(page, label) {
  const res = await page.goto(`${BASE}/auth/login`, {
    waitUntil: "networkidle",
  });
  if (!res || res.status() !== 200) {
    throw new Error(`${label}: /auth/login HTTP ${res?.status() ?? "error"}`);
  }
  console.log(`PASS: ${label} — /auth/login HTTP 200`);

  const body = await page.locator("body").innerText();
  assertContains(body, "AdMe 로그인", `${label} title`);
  assertContains(body, "Google로 계속하기", `${label} google button`);
  assertContains(body, "카카오톡으로 계속하기", `${label} kakao button`);
  assertContains(body, "이메일", `${label} email label`);
  assertContains(body, "비밀번호", `${label} password label`);
  assertContains(body, "로그인", `${label} login button`);

  assertNotContains(body, "stage1C", `${label} no stage1C`);
  assertNotContains(body, "stage1D", `${label} no stage1D`);
  assertNotContains(body, "Stage 1-C", `${label} no Stage 1-C`);
  assertNotContains(body, "Stage 1-D", `${label} no Stage 1-D`);
  assertNotContains(body, "ServiceRoleUsed", `${label} no ServiceRoleUsed`);
  assertNotContains(body, "PointLedgerMutation", `${label} no PointLedgerMutation`);
  assertNotContains(body, "QuizAnswerAccess", `${label} no QuizAnswerAccess`);
  assertNotContains(body, "DeployCommit", `${label} no DeployCommit`);
  assertNotContains(body, "deploy commit:", `${label} no deploy commit footer`);

  await checkNoHorizontalScroll(page, label);
}

async function verifyPublicProfile(page, label) {
  await page.goto(`${BASE}/consumer/profile`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();

  assertNotContains(body, "stage1CProfileRoute", `${label} no stage1C block`);
  assertNotContains(body, "stage1CSessionStatus", `${label} no stage1C session`);
  assertNotContains(body, "stage1DSocialProvider", `${label} no stage1D block`);
  assertNotContains(body, "Stage 1-C Authenticated", `${label} no stage1C header`);
  assertNotContains(body, "stage-1-c-authenticated", `${label} no stage1C slug`);

  await checkNoHorizontalScroll(page, label);
}

async function verifyDiagnostics(page) {
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();

  assertContains(body, "DB check status", "diagnostics db label");
  assertContains(body, "Stage 1-D-A Public UI Cleanup", "diagnostics stage1da title");
  assertContains(body, "stage-1-d-a-public-ui-cleanup", "diagnostics stage1da slug");
  assertContains(body, "stage1DAPublicLoginClean=true", "diagnostics login clean");
  assertContains(body, "stage1DAPublicProfileClean=true", "diagnostics profile clean");
  assertContains(body, "stage1DAAuthCompleted=true", "diagnostics auth completed");
  assertContains(body, "stage1DAGoogleOAuthE2E=pass", "diagnostics google e2e");
  assertContains(
    body,
    "stage1DAKakaoOAuthE2E=not_tested",
    "diagnostics kakao e2e",
  );
  assertContains(body, "stage1DAServiceRoleUsed=false", "diagnostics service role");
  assertContains(body, "stage1DAPointLedgerMutation=false", "diagnostics point ledger");
  assertContains(body, "stage1DAQuizAnswerAccess=false", "diagnostics quiz answer");
  assertContains(body, "stage1DAFullUserIdExposure=false", "diagnostics user id");
  assertContains(body, "stage1DAEmailMasked=true", "diagnostics email masked");

  const deployMatch = body.match(/stage1DADeployCommit=([a-f0-9]{7}|unknown)/);
  if (!deployMatch) {
    throw new Error("diagnostics: missing stage1DADeployCommit");
  }
  const deployCommit = deployMatch[1];
  console.log(`PASS: diagnostics — stage1DADeployCommit=${deployCommit}`);

  const statusLine = body.match(/DB check status:\s*(\w+)/);
  if (!statusLine || statusLine[1] !== "ok") {
    throw new Error(`diagnostics: DB check status not ok (got ${statusLine?.[1]})`);
  }
  console.log("PASS: diagnostics — DB check status ok");

  const dlDeploy = body.match(/Deploy commit:\s*([a-f0-9]{7}|unknown)/);
  if (dlDeploy && dlDeploy[1] !== deployCommit) {
    throw new Error(
      `diagnostics: deploy commit mismatch ${dlDeploy[1]} vs ${deployCommit}`,
    );
  }
  console.log(`PASS: diagnostics — deploy commit consistent (${deployCommit})`);

  return deployCommit;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  await page.setViewportSize({ width: 390, height: 844 });
  await verifyPublicLogin(page, "mobile-390-login");
  await verifyPublicProfile(page, "mobile-390-profile");

  await page.setViewportSize({ width: 1280, height: 800 });
  await verifyPublicLogin(page, "desktop-1280-login");
  await verifyPublicProfile(page, "desktop-1280-profile");

  const deployCommit = await verifyDiagnostics(page);

  console.log(`\nStage 1-D-A Public UI Production verification PASSED (commit ${deployCommit})`);
} finally {
  await browser.close();
}
