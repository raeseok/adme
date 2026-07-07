/**
 * Stage 2-A — Production/local smoke: /consumer/ads read-only UI
 */
import { chromium, devices } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const REQUIRED_MARKERS = [
  "Stage 2-A: 광고 카드·퀴즈 안전 골격",
  "읽기 전용 광고 카드 미리보기",
  "포인트 원장 변경 없음",
  "퀴즈 정답은 화면과 네트워크 응답에 포함하지 않습니다",
  "카카오톡 광고 도착 알림은 향후 선택 동의 기반 기능으로 검토 중입니다",
];

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

async function verifyAdsPage(page, label) {
  const res = await page.goto(`${BASE}/consumer/ads`, { waitUntil: "networkidle" });
  if (!res || res.status() !== 200) {
    throw new Error(`${label}: /consumer/ads HTTP ${res?.status() ?? "error"}`);
  }
  console.log(`PASS: ${label} — /consumer/ads HTTP 200`);

  const body = await page.locator("body").innerText();
  for (const marker of REQUIRED_MARKERS) {
    assertContains(body, marker, label);
  }

  assertContains(body, "퀴즈 미리보기", `${label} quiz section`);
  assertContains(body, "정답 제출 (Stage 2-B 예정)", `${label} disabled submit`);
  assertContains(body, "현재 단계에서는 포인트가 적립되지 않습니다", `${label} no reward`);
  assertNotContains(body, "적립 완료", `${label} no 적립 완료`);
  assertNotContains(body, "정답 보기", `${label} no 정답 보기`);
  assertNotContains(body, "correct option", `${label} no correct option`);

  const cards = page.locator("article");
  const count = await cards.count();
  if (count < 1) {
    throw new Error(`${label}: expected at least 1 ad card`);
  }
  console.log(`PASS: ${label} — ${count} ad card(s)`);

  const radios = page.locator('input[type="radio"]');
  const radioCount = await radios.count();
  if (radioCount < 2) {
    throw new Error(`${label}: expected quiz options (radio count ${radioCount})`);
  }
  console.log(`PASS: ${label} — ${radioCount} quiz option(s)`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [label, viewport] of [
      ["mobile-390", devices["Pixel 5"].viewport],
      ["desktop-1440", { width: 1440, height: 900 }],
    ]) {
      const page = await browser.newPage({ viewport });
      await verifyAdsPage(page, label);
      await page.close();
    }
    console.log("PASS: smoke:stage2a-ad-card-ui");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
