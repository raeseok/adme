/**
 * Stage 1-G-R — Production profile basic/optional section UX smoke
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const REQUIRED_COPY = [
  "기본 정보",
  "기본 정보는 맞춤 소비정보를 받기 위한 최소 조건입니다.",
  "본인 출생년도, 성별, 주거지역은 기본 정보로 등록해 주세요.",
  "선택 정보",
  "선택 정보는 더 정교한 맞춤 소비정보를 받기 위한 추가 조건입니다.",
  "더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.",
  "입력하지 않아도 기본 프로필 저장은 가능합니다.",
  "소비성향 프로필은 광고를 보내달라는 나의 요구입니다.",
  "출생년도",
  "성별",
  "주거지역",
  "가장 큰 자녀 생년",
  "막내 자녀 생년",
  "반려동물 조건",
  "강아지",
  "고양이",
  "기타",
  "주활동지역 1",
  "주활동지역 2",
];

const FORBIDDEN = [
  "개인정보를 입력해 주세요",
  "개인정보 제공",
  "stage1GBuild=",
  "stage1GRBuild=",
];

const OPTIONAL_COPY =
  "더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.";

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

  const optionalSection = page.getByTestId("optional-profile-section");
  const optionalText = await optionalSection.innerText();
  if (!optionalText.includes(OPTIONAL_COPY)) {
    throw new Error(
      `${label}: optional section missing "${OPTIONAL_COPY}"`,
    );
  }
  console.log(`PASS: ${label} — optional section contains expansion copy`);

  const basicHeading = page.getByRole("heading", { name: "기본 정보" });
  const optionalHeading = page.getByRole("heading", { name: "선택 정보" });
  const basicBox = await basicHeading.boundingBox();
  const optionalBox = await optionalHeading.boundingBox();
  if (!basicBox || !optionalBox || basicBox.y >= optionalBox.y) {
    throw new Error(`${label}: basic section must appear before optional section`);
  }
  console.log(`PASS: ${label} — basic section precedes optional section`);

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
    console.log("PASS: smoke:stage1g-r-profile-basic-optional-ux");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
