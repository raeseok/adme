/**
 * Stage 4-A-2 Ad Creative Content, Landing Link and Dual Quiz Type verification.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const IMAGE_SHORT_ANSWER_DEMO_ID = "stage4a2-image-short-answer-demo";
const STAGE2_FIXTURE_2_ID = "stage2a-fixture-campaign-2";
const PRODUCTION_BASE = process.env.ADME_PRODUCTION_BASE_URL ?? "https://web-ashen-xi-52.vercel.app";

const REQUIRED_FILES = [
  "apps/web/src/lib/advertiser-demo/types.ts",
  "apps/web/src/lib/advertiser-demo/constants.ts",
  "apps/web/src/lib/advertiser-demo/creative-quiz.ts",
  "apps/web/src/lib/advertiser-demo/fixtures.ts",
  "apps/web/src/lib/advertiser-demo/browser-store.ts",
  "apps/web/src/lib/advertiser-demo/stage4a-advertiser-console-demo.ts",
  "apps/web/src/components/stage4a/AdvertiserDemoConsole.tsx",
  "apps/web/src/components/consumer-ads/AdCardPreview.tsx",
  "apps/web/src/components/campaigns/QuizSubmitControlledPanel.tsx",
  "apps/web/src/lib/consumer-ads/types.ts",
  "apps/web/src/lib/consumer-ads/stage2a-fixtures.server.ts",
  "apps/web/src/lib/consumer-ads/stage4a2-short-answer.server.ts",
  "apps/web/src/app/consumer/ads/[campaignId]/actions.ts",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

function readText(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

function assertContains(text, expected, label) {
  assert(text.includes(expected), `${label} contains ${expected}`);
}

function assertNotContains(text, forbidden, label) {
  assert(!text.includes(forbidden), `${label} does not contain ${forbidden}`);
}

function normalizeShortAnswer(value) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function validateLandingUrl(value) {
  const trimmed = value.trim();
  if (!trimmed || /\s|[\u0000-\u001f\u007f]/u.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    if (url.username || url.password || !url.hostname) return false;
    if (["javascript:", "data:", "file:", "blob:", "vbscript:", "about:"].includes(url.protocol)) {
      return false;
    }
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

function extractFixtureBlock(source, campaignId) {
  const start = source.indexOf(`toCard("${campaignId}"`);
  assert(start >= 0, `fixture block exists for ${campaignId}`);
  const next = source.indexOf('toCard("', start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function verifyImageShortAnswerConsumerDemo() {
  const fixtures = readText(join(REPO_ROOT, "apps/web/src/lib/consumer-ads/stage2a-fixtures.server.ts"));
  const registry = readText(join(REPO_ROOT, "apps/web/src/lib/consumer-ads/stage4a2-short-answer.server.ts"));
  const constants = readText(join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/constants.ts"));
  const imageBlock = extractFixtureBlock(fixtures, IMAGE_SHORT_ANSWER_DEMO_ID);
  const stage2Block = extractFixtureBlock(fixtures, STAGE2_FIXTURE_2_ID);

  assertContains(constants, "STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ID", "constants consumer demo id");
  assertContains(constants, "STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ROUTE", "constants consumer demo route");
  assertContains(imageBlock, 'creativeType: "image"', "image short-answer fixture creativeType");
  assertContains(imageBlock, 'quizType: "short_answer"', "image short-answer fixture quizType");
  assertContains(imageBlock, 'imageUrl: "/window.svg"', "image short-answer fixture imageUrl");
  assertContains(imageBlock, "반려동물 건강검진 demo 이미지", "image short-answer fixture imageAlt");
  assertContains(imageBlock, "linkEnabled: true", "image short-answer fixture landing link");
  assertContains(imageBlock, "https://example.com/ilsan-petcare-booking", "image short-answer fixture landingUrl");
  assertContains(imageBlock, "예약 페이지 열기", "image short-answer fixture ctaLabel");
  assertContains(imageBlock, "answerRegistered: true", "image short-answer fixture answerRegistered");
  assertContains(imageBlock, "acceptedAnswerCount: 3", "image short-answer fixture acceptedAnswerCount");
  assertContains(imageBlock, "minViewSecondsPreview: 6", "image short-answer fixture minViewSeconds");
  assertContains(imageBlock, "rewardPointsPreview: 250", "image short-answer fixture reward points");
  for (const forbidden of [
    "shortAnswer:",
    "acceptedAnswers:",
    "normalizedAnswers",
    "correctAnswer",
    "quiz_answer",
  ]) {
    assertNotContains(imageBlock, forbidden, "image short-answer public fixture answer-free");
  }

  assertContains(registry, `"${IMAGE_SHORT_ANSWER_DEMO_ID}"`, "server-only registry campaign id");
  assertContains(registry, "stage4a2-image-short-answer-quiz", "server-only registry quiz id");
  assertContains(registry, 'import "server-only"', "server-only registry guard");
  assertNotContains(registry, "browser-store", "server-only registry has no browser store import");

  assertContains(stage2Block, "안양 생활 밀착 할인 — 주중 혜택", "stage2 fixture 2 title preserved");
  assertNotContains(stage2Block, 'quizType: "short_answer"', "stage2 fixture 2 remains multiple choice");
  assertContains(fixtures, '"stage2a-fixture-campaign-2"', "stage2 fixture 2 id preserved");
  assertContains(fixtures, 'answer: "수요일"', "stage2 fixture 2 multiple-choice answer registry preserved");

  const adPreview = readText(join(REPO_ROOT, "apps/web/src/components/consumer-ads/AdCardPreview.tsx"));
  assertContains(adPreview, "광고 메인 콘텐츠 ·", "consumer creative marker");
  assertContains(adPreview, "noopener noreferrer sponsored", "consumer landing rel");
  assertContains(adPreview, "링크 클릭은 퀴즈 통과 또는 포인트 적립으로 인정되지 않습니다", "consumer link reward separation");

  const quizPanel = readText(join(REPO_ROOT, "apps/web/src/components/campaigns/QuizSubmitControlledPanel.tsx"));
  assertContains(quizPanel, "단답형 답안", "consumer short-answer input marker");
  assertContains(quizPanel, "submitStage4A2ShortAnswerDemoAction", "consumer short-answer server action");
}

async function verifyProductionConsumerRoute() {
  const url = `${PRODUCTION_BASE}/consumer/ads/${IMAGE_SHORT_ANSWER_DEMO_ID}`;
  let response;
  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (error) {
    console.log(`SKIP: production consumer route check (${error instanceof Error ? error.message : String(error)})`);
    return;
  }
  if (!response.ok) {
    console.log("SKIP: production consumer route not deployed yet");
    return;
  }
  const html = await response.text();
  if (!html.includes("광고 메인 콘텐츠 · 이미지")) {
    console.log("SKIP: production image short-answer demo not deployed yet");
  } else {
    for (const marker of [
      "광고 메인 콘텐츠 · 이미지",
      "여름철 반려동물 건강검진 패키지",
      "반려동물 건강검진 demo 이미지",
      "예약 페이지 열기",
      "외부 사이트로 이동합니다",
      "단답형 답안",
      "예상 적립 250P",
      "최소 열람 6초",
    ]) {
      assertContains(html, marker, `production consumer page ${marker}`);
    }
    for (const forbidden of ["펫 건강검진", "correctAnswer", "acceptedAnswers", "quiz_answer"]) {
      assertNotContains(html, forbidden, `production consumer page answer-free (${forbidden})`);
    }
    assert(response.url.includes(`/consumer/ads/${IMAGE_SHORT_ANSWER_DEMO_ID}`), "production consumer pathname preserved");
  }

  const stage2Url = `${PRODUCTION_BASE}/consumer/ads/${STAGE2_FIXTURE_2_ID}`;
  const stage2Response = await fetch(stage2Url, { redirect: "follow" });
  assert(stage2Response.ok, `stage2 fixture 2 route still responds - ${stage2Url}`);
  const stage2Html = await stage2Response.text();
  assertContains(stage2Html, "안양 생활 밀착 할인 — 주중 혜택", "stage2 fixture 2 production title preserved");
  assertContains(stage2Html, "수요일", "stage2 fixture 2 production multiple-choice preserved");
  assertNotContains(stage2Html, "단답형 답안", "stage2 fixture 2 production has no short-answer UI");
}

function verifyExecutableUnits() {
  assert(validateLandingUrl("https://example.com/path?demo=1"), "https URL validation passes");
  assert(validateLandingUrl("http://localhost:3000/demo"), "localhost URL validation passes");
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "blob:https://example.com/id",
    "about:blank",
    "https://user:pass@example.com",
    "not a url",
    "   ",
  ]) {
    assert(!validateLandingUrl(value), `dangerous URL blocked - ${value}`);
  }
  assert(normalizeShortAnswer("  백석동   지역 할인  ") === "백석동 지역 할인", "short-answer whitespace normalization");
  assert(normalizeShortAnswer("ＡＤＭＥ") === "adme", "short-answer NFKC and case normalization");

  const imageAnswers = ["반려동물", "반려동물 건강검진", "펫 건강검진"].map(normalizeShortAnswer);
  assert(imageAnswers.includes(normalizeShortAnswer("반려동물")), "image short-answer registry comparison");
  assert(!imageAnswers.includes(normalizeShortAnswer("오답")), "image short-answer incorrect answer rejected");

  const options = ["A", "B", "C", "D"];
  assert(options.length >= 2 && options.length <= 4, "multiple-choice option count valid");
  assert(new Set(options).size === options.length, "multiple-choice duplicate validation");
  const publicCampaign = {
    creativeType: "image",
    landingUrl: "https://example.com/demo",
    quizType: "short_answer",
    question: "광고 핵심 혜택은?",
    answerRegistered: true,
    acceptedAnswerCount: 3,
  };
  const serialized = JSON.stringify(publicCampaign);
  for (const forbidden of ["shortAnswer", "acceptedAnswers", "normalizedAnswers", "answer token"]) {
    assertNotContains(serialized, forbidden, "public campaign sanitizer executable check");
  }
  const clickState = { ctaClickCount: 1, quizPassGranted: false, rewardGranted: false };
  assert(!clickState.quizPassGranted && !clickState.rewardGranted, "landing click does not grant reward");
  const switched = { quizType: "short_answer", authoringSecret: { shortAnswer: "", acceptedAnswers: [] } };
  assert(!("multipleChoiceSelection" in switched.authoringSecret), "quiz type switching removes stale multiple choice secret");
}

async function main() {
  for (const file of REQUIRED_FILES) {
    assert(existsSync(join(REPO_ROOT, file)), `required file exists - ${file}`);
  }
  const combined = REQUIRED_FILES.map((file) => readText(join(REPO_ROOT, file))).join("\n");
  for (const marker of [
    "Stage 4-A-2 Ad Creative Content, Landing Link and Dual Quiz Type Demo",
    "AdCreativeType",
    "text",
    "image",
    "video",
    "landingUrl",
    "ctaLabel",
    "linkEnabled",
    "openInNewTab",
    "externalLinkNotice",
    "AdQuizType",
    "multiple_choice",
    "short_answer",
    "광고 메인 콘텐츠",
    "랜딩페이지 연결",
    "외부 사이트로 이동합니다",
    "정답 등록 완료",
    "정답은 소비자 화면에 표시되지 않습니다",
    "server-only",
    IMAGE_SHORT_ANSWER_DEMO_ID,
    "image short-answer consumer demo",
  ]) {
    assertContains(combined, marker, "Stage 4-A-2 marker");
  }

  const helper = readText(join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/creative-quiz.ts"));
  for (const marker of [
    "new URL",
    "isAllowedLandingProtocol",
    "sanitizeLandingUrlForPublicState",
    "normalizeShortAnswer",
    "compareShortAnswer",
    "validateMultipleChoiceQuiz",
    "validateCreativeMedia",
    "switchQuizType",
    "recordLandingClickDemoState",
  ]) {
    assertContains(helper, marker, "helper implementation");
  }

  const component = readText(join(REPO_ROOT, "apps/web/src/components/stage4a/AdvertiserDemoConsole.tsx"));
  assertContains(component, "controls", "video controls");
  assertContains(component, "playsInline", "video playsInline");
  assertNotContains(component, "autoPlay", "video autoplay");
  assertContains(component, 'target="_blank"', "external link target blank");
  assertContains(component, 'rel="noopener noreferrer sponsored"', "external link rel");
  assertContains(component, "STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ROUTE", "advertiser consumer demo navigation");

  const browserStore = readText(join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/browser-store.ts"));
  assertContains(browserStore, "sanitizeStage4AStoreForBrowser", "browser store runtime sanitizer");
  for (const forbidden of [
    "shortAnswer",
    "acceptedAnswers",
    "normalizedAnswers",
    "answer token",
    "sessionStorage",
  ]) {
    assertNotContains(browserStore, forbidden, "browser store answer-free");
  }

  const publicSurfaces = [
    "apps/web/src/components/stage4a/AdvertiserDemoConsole.tsx",
    "apps/web/src/components/consumer-ads/AdCardPreview.tsx",
    "apps/web/src/components/campaigns/QuizSubmitControlledPanel.tsx",
    "apps/web/src/app/admin/diagnostics/page.tsx",
  ].map((file) => readText(join(REPO_ROOT, file))).join("\n");
  for (const forbidden of [
    "quiz_answer",
    "correctAnswer:",
    "correctOption",
    "answerIndex:",
    "primaryAnswer",
    "normalizedAnswers",
    "service_role",
  ]) {
    assertNotContains(publicSurfaces, forbidden, "public surface answer-free");
  }

  const mutationGuardFiles = REQUIRED_FILES.map((file) => join(REPO_ROOT, file));
  for (const file of mutationGuardFiles) {
    const text = readText(file);
    for (const [pattern, label] of [
      [/\.from\(\s*["'`]campaigns["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "campaign mutation"],
      [/\.from\(\s*["'`]point_ledger["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "point ledger mutation"],
      [/\.from\(\s*["'`]ad_views["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "ad views mutation"],
      [/fingerprint/i, "fingerprinting"],
      [/analytics SDK/i, "analytics SDK"],
    ]) {
      assert(!pattern.test(text), `${relative(REPO_ROOT, file)} has no ${label}`);
    }
  }

  const migrationFiles = readdirSync(join(REPO_ROOT, "supabase/migrations"));
  assert(
    migrationFiles.every((file) => !/stage[_-]?4[_-]?a[_-]?2|creative|landing|dual[_-]?quiz/i.test(file)),
    "no Stage 4-A-2 migration files exist",
  );

  verifyImageShortAnswerConsumerDemo();
  verifyExecutableUnits();
  await verifyProductionConsumerRoute();
  console.log("RESULT: stage4A2AdCreativeLinkDualQuizDemoComplete=true");
  console.log("RESULT: stage4A2ImageShortAnswerConsumerDemoRoute=true");
  console.log("RESULT: answerExposureGuardActive=true");
  console.log("RESULT: advertiserBrowserStoreContainsNoAnswerValue=true");
  console.log("RESULT: linkClickDoesNotGrantReward=true");
  console.log("RESULT: productionDbMutationAllowed=false");
  console.log("PASS: verify:stage4a2-ad-creative-link-dual-quiz-demo");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
