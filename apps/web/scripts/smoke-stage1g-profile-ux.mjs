/**
 * Stage 1-G — Production profile UX visible copy (mobile + desktop)
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const REQUIRED_COPY = [
  "소비성향 프로필은 광고를 보내달라는 나의 요구입니다.",
  "더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.",
  "가장 큰 자녀 생년",
  "막내 자녀 생년",
  "자녀가 없거나 입력을 원하지 않으면 비워두셔도 됩니다.",
  "자녀 생년은 자녀 관련 소비정보 조건으로만 사용됩니다.",
  "반려동물 조건",
  "강아지",
  "고양이",
  "기타",
  "반려동물이 없거나 입력을 원하지 않으면 비워두셔도 됩니다.",
  "반려동물 정보는 반려동물 관련 소비정보 조건으로만 사용됩니다.",
];

const FORBIDDEN = [
  "stage1GBuild=",
  "stage1GChildBirthYearFields=",
  "stage1GPetConditionFields=",
  "stage1GProfileActiveRequestCopy=",
  "stage1GPointLedgerMutation=",
  "stage1GPublicMarkerExposed=",
  "개인정보를 입력해 주세요",
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

async function verifyViewport(page, label, viewport) {
  await page.setViewportSize(viewport);
  const res = await page.goto(`${BASE}/consumer/profile`, {
    waitUntil: "networkidle",
  });
  if (!res || res.status() !== 200) {
    throw new Error(`${label}: HTTP ${res?.status() ?? "error"}`);
  }
  console.log(`PASS: ${label} — /consumer/profile HTTP 200`);

  const body = await page.locator("body").innerText();
  for (const phrase of REQUIRED_COPY) {
    assertContains(body, phrase, label);
  }
  for (const phrase of FORBIDDEN) {
    assertNotContains(body, phrase, label);
  }

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollWidth > clientWidth + 1) {
    throw new Error(`${label}: horizontal scroll ${scrollWidth} > ${clientWidth}`);
  }
  console.log(`PASS: ${label} — no horizontal scroll`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await verifyViewport(page, "mobile", { width: 390, height: 844 });
    await verifyViewport(page, "desktop", { width: 1440, height: 900 });
    console.log("PASS: smoke:stage1g-profile-ux");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
