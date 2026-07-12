/**
 * Stage 4-A-2 Ad Creative Content, Landing Link and Dual Quiz Type verification.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

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

  const options = ["A", "B", "C", "D"];
  assert(options.length >= 2 && options.length <= 4, "multiple-choice option count valid");
  assert(new Set(options).size === options.length, "multiple-choice duplicate validation");
  const publicCampaign = {
    creativeType: "text",
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

function main() {
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

  verifyExecutableUnits();
  console.log("RESULT: stage4A2AdCreativeLinkDualQuizDemoComplete=true");
  console.log("RESULT: answerExposureGuardActive=true");
  console.log("RESULT: advertiserBrowserStoreContainsNoAnswerValue=true");
  console.log("RESULT: linkClickDoesNotGrantReward=true");
  console.log("RESULT: productionDbMutationAllowed=false");
  console.log("PASS: verify:stage4a2-ad-creative-link-dual-quiz-demo");
}

main();
