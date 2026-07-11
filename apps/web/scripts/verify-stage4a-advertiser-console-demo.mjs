/**
 * Stage 4-A Advertiser Console Investor Demo Flow verification.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

const REQUIRED_FILES = [
  "docs/adme/stage-4-a-advertiser-console-investor-demo-flow.md",
  "apps/web/src/lib/advertiser-demo/types.ts",
  "apps/web/src/lib/advertiser-demo/constants.ts",
  "apps/web/src/lib/advertiser-demo/fixtures.ts",
  "apps/web/src/lib/advertiser-demo/calculations.ts",
  "apps/web/src/lib/advertiser-demo/state-machine.ts",
  "apps/web/src/lib/advertiser-demo/browser-store.ts",
  "apps/web/src/lib/advertiser-demo/selectors.ts",
  "apps/web/src/lib/advertiser-demo/stage4a-advertiser-console-demo.ts",
  "apps/web/src/components/stage4a/AdvertiserDemoConsole.tsx",
  "apps/web/src/app/advertiser/page.tsx",
  "apps/web/src/app/advertiser/dashboard/page.tsx",
  "apps/web/src/app/advertiser/campaigns/page.tsx",
  "apps/web/src/app/advertiser/campaigns/new/page.tsx",
  "apps/web/src/app/advertiser/campaigns/[campaignId]/page.tsx",
  "apps/web/src/app/advertiser/campaigns/[campaignId]/preview/page.tsx",
  "apps/web/src/app/advertiser/campaigns/[campaignId]/performance/page.tsx",
  "apps/web/src/app/admin/campaign-review/page.tsx",
  "apps/web/src/app/admin/campaign-review/[campaignId]/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

const REQUIRED_MARKERS = [
  "Stage 4-A Advertiser Console Investor Demo Flow",
  "투자자 데모 · 광고주 콘솔",
  "DEMO / SANDBOX — 실제 결제·캠페인 집행 없음",
  "소비자의 개인 식별 정보는 광고주에게 제공되지 않습니다.",
  "정답은 서버 전용 정보이며 소비자 화면에 노출되지 않습니다.",
  "투자자 데모 · 캠페인 검토",
  "Production DB mutation 없음",
  "Demo Performance Data",
  "Verified Views",
  "Quiz Pass Rate",
  "Demo Point Spend",
  "Cost per Verified Engagement",
];

const REQUIRED_STATE_MARKERS = [
  "stage4AAdvertiserConsoleDemoComplete",
  "investorDemoFocused",
  "sandboxOnly",
  "productionCampaignMutationAllowed",
  "productionDbMutationAllowed",
  "productionMigrationImplemented",
  "actualAdvertiserPaymentImplemented",
  "actualCampaignExecutionImplemented",
  "actualPointBudgetDeductionImplemented",
  "actualPersonalDataCollectionImplemented",
  "quizAnswerConsumerExposed",
  "quizAnswerPersistedInBrowserStore",
  "advertiserDemoResetAvailable",
  "campaignWizardComplete",
  "consumerPreviewAvailable",
  "adminReviewDemoAvailable",
  "performanceDashboardDemoAvailable",
  "mobileVerified",
  "desktopVerified",
  "overallDemoStatus",
];

const ROUTES = [
  "/advertiser",
  "/advertiser/dashboard",
  "/advertiser/campaigns",
  "/advertiser/campaigns/new",
  "/advertiser/campaigns/",
  "/preview",
  "/performance",
  "/admin/campaign-review",
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

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const stat = statSync(root);
  if (stat.isFile()) return [root];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return walkFiles(path);
    return entry.isFile() ? [path] : [];
  });
}

function verifyRequiredFiles() {
  for (const file of REQUIRED_FILES) {
    assert(existsSync(join(REPO_ROOT, file)), `required file exists - ${file}`);
  }
}

function verifyMarkers() {
  const combined = REQUIRED_FILES.map((file) => readText(join(REPO_ROOT, file))).join("\n");
  for (const marker of REQUIRED_MARKERS) {
    assertContains(combined, marker, "Stage 4-A visible marker");
  }
  for (const marker of REQUIRED_STATE_MARKERS) {
    assertContains(combined, marker, "Stage 4-A diagnostics marker");
  }
  for (const route of ROUTES) {
    assertContains(combined, route, "Stage 4-A route marker");
  }
}

function verifyFixturesAndCalculations() {
  const fixtures = readText(join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/fixtures.ts"));
  const calculations = readText(
    join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/calculations.ts"),
  );
  const stateMachine = readText(
    join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/state-machine.ts"),
  );
  const browserStore = readText(
    join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/browser-store.ts"),
  );
  const constants = readText(join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/constants.ts"));

  for (const campaignName of [
    "백석 생활권 평일 점심 할인",
    "일산 반려동물 건강검진 안내",
    "종로 직장인 퇴근길 프로모션",
    "지역 베이커리 신메뉴 체험",
  ]) {
    assertContains(fixtures, campaignName, "deterministic demo campaign");
  }
  for (const status of [
    "draft",
    "submitted",
    "under_review",
    "changes_requested",
    "approved",
    "active",
    "completed",
    "rejected",
  ]) {
    assertContains(fixtures + stateMachine, status, `campaign status ${status}`);
  }
  assertNotContains(fixtures + calculations, "Math.random", "deterministic fixture/calculation");
  assertContains(calculations, "Math.floor(demoBudgetPoints / pointPerPass)", "maximumRewardedEngagements integer calculation");
  assertContains(calculations, "estimatedRemainingBudget: demoBudgetPoints - estimatedPointSpend", "remaining budget calculation");
  assertContains(stateMachine, "canStage4ATransition", "invalid transition guard");
  assertContains(stateMachine, "STAGE4A_ALLOWED_TRANSITIONS", "allowed transitions");
  assertContains(browserStore + constants, "adme-stage4a-advertiser-demo-v1", "schema versioned localStorage key");
  assertContains(browserStore, "resetVersion", "demo reset version");
}

function verifyQuizAnswerNonExposure() {
  const stage4Root = join(REPO_ROOT, "apps/web/src");
  const files = walkFiles(stage4Root).filter((file) =>
    relative(REPO_ROOT, file).includes("stage4a") ||
    relative(REPO_ROOT, file).includes("advertiser-demo") ||
    relative(REPO_ROOT, file).includes("advertiser") ||
    relative(REPO_ROOT, file).includes("campaign-review"),
  );
  const combined = files.map(readText).join("\n");
  for (const forbidden of [
    "quiz_answer",
    "correctAnswer:",
    "answerIndex:",
    "quizAnswer:",
    "console.log",
  ]) {
    assertNotContains(combined, forbidden, "quiz answer non-exposure");
  }
  const browserStore = readText(
    join(REPO_ROOT, "apps/web/src/lib/advertiser-demo/browser-store.ts"),
  );
  for (const forbidden of [
    "authorChoice",
    "email",
    "phone",
    "businessRegistration",
    "account",
    "token",
    "supabase",
  ]) {
    assertNotContains(browserStore, forbidden, "browser store payload safety");
  }
}

function verifyNoProductionMutationCode() {
  const roots = [
    join(REPO_ROOT, "apps/web/src/app/advertiser"),
    join(REPO_ROOT, "apps/web/src/app/admin/campaign-review"),
    join(REPO_ROOT, "apps/web/src/components/stage4a"),
    join(REPO_ROOT, "apps/web/src/lib/advertiser-demo"),
  ];
  const combined = roots.flatMap(walkFiles).map(readText).join("\n");
  for (const forbidden of [
    "createClient(",
    ".from(",
    ".insert(",
    ".update(",
    ".upsert(",
    ".delete(",
    ".rpc(",
    "fetch(",
    "method: \"POST\"",
    "method: \"PUT\"",
    "method: \"PATCH\"",
    "method: \"DELETE\"",
    "INSERT INTO public.campaigns",
    "UPDATE public.campaigns",
    "DELETE FROM public.campaigns",
    "INSERT INTO public.point_ledger",
  ]) {
    assertNotContains(combined, forbidden, "Production mutation guard");
  }
}

function verifyNoStage4AMigration() {
  const migrationDir = join(REPO_ROOT, "supabase/migrations");
  const stage4AFiles = readdirSync(migrationDir).filter((file) =>
    file.toLowerCase().includes("stage_4_a"),
  );
  assert(stage4AFiles.length === 0, "no Stage 4-A SQL migration files exist");
}

function verifyViewportStaticMarkers() {
  const component = readText(
    join(REPO_ROOT, "apps/web/src/components/stage4a/AdvertiserDemoConsole.tsx"),
  );
  assertContains(component, "sm:grid-cols-2", "mobile responsive card grids");
  assertContains(component, "lg:grid-cols-4", "desktop responsive KPI grids");
  assertNotContains(component, "min-w-[", "no forced wide layout");
}

function main() {
  verifyRequiredFiles();
  verifyMarkers();
  verifyFixturesAndCalculations();
  verifyQuizAnswerNonExposure();
  verifyNoProductionMutationCode();
  verifyNoStage4AMigration();
  verifyViewportStaticMarkers();
  console.log("RESULT: stage4AAdvertiserConsoleDemoComplete=true");
  console.log("RESULT: sandboxOnly=true");
  console.log("RESULT: productionDbMutationAllowed=false");
  console.log("RESULT: productionMigrationImplemented=false");
  console.log("RESULT: quizAnswerConsumerExposed=false");
  console.log("RESULT: quizAnswerPersistedInBrowserStore=false");
  console.log("RESULT: overallDemoStatus=ready");
  console.log("PASS: verify:stage4a-advertiser-console-demo");
}

main();
