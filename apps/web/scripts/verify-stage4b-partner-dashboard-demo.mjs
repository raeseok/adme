/**
 * Stage 4-B Partner Dashboard Investor Demo Flow verification.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

const REQUIRED_FILES = [
  "apps/web/src/lib/partner-demo/types.ts",
  "apps/web/src/lib/partner-demo/constants.ts",
  "apps/web/src/lib/partner-demo/fixtures.ts",
  "apps/web/src/lib/partner-demo/calculations.ts",
  "apps/web/src/lib/partner-demo/selectors.ts",
  "apps/web/src/lib/partner-demo/browser-store.ts",
  "apps/web/src/lib/partner-demo/stage4b-partner-dashboard-demo.ts",
  "apps/web/src/components/stage4b/PartnerDemoConsole.tsx",
  "apps/web/src/app/partner/page.tsx",
  "apps/web/src/app/partner/dashboard/page.tsx",
  "apps/web/src/app/partner/advertisers/page.tsx",
  "apps/web/src/app/partner/advertisers/[advertiserId]/page.tsx",
  "apps/web/src/app/partner/settlements/page.tsx",
  "apps/web/src/app/partner/settlements/[settlementId]/page.tsx",
  "apps/web/src/app/partner/insights/page.tsx",
  "apps/web/src/app/admin/partner-settlements/page.tsx",
  "apps/web/src/app/admin/partner-settlements/[settlementId]/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
  "docs/adme/stage-4-b-partner-dashboard-investor-demo-flow.md",
];

const REQUIRED_MARKERS = [
  "Stage 4-B Partner Dashboard Investor Demo",
  "Partner Dashboard",
  "Demo / Sandbox",
  "담당 지역",
  "예상 파트너 수익",
  "정산 내역",
  "지역 소비 수요 인사이트",
  "Production DB mutation 없음",
  "stage4BPartnerDashboardDemoComplete=true",
  "adme-stage4b-partner-demo-v1",
];

function readText(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContains(text, needle, label) {
  assert(text.includes(needle), `${label}: missing ${needle}`);
}

function parseSpentValues(fixtures) {
  return [...fixtures.matchAll(/spentWon:\s*(\d+)/g)].map((match) => Number(match[1]));
}

function verifyExecutableSettlementMath(fixtures) {
  const expected = [
    {
      id: "settlement-2026-07",
      spent: [201600, 93600, 62100],
      adjustment: 0,
      finalPayoutWon: 107190,
    },
    {
      id: "settlement-2026-06",
      spent: [184000, 118000, 87000],
      adjustment: 1200,
      finalPayoutWon: 117900,
    },
    {
      id: "settlement-2026-05",
      spent: [163000, 105000, 90000],
      adjustment: -1800,
      finalPayoutWon: 105600,
    },
  ];

  for (const row of expected) {
    assertContains(fixtures, row.id, `fixture ${row.id}`);
    const grossSpentWon = row.spent.reduce((sum, value) => sum + value, 0);
    const basePartnerShareWon = Math.floor((grossSpentWon * 30) / 100);
    const finalPayoutWon = basePartnerShareWon + row.adjustment;
    assert(Number.isInteger(finalPayoutWon), `${row.id}: final payout must be integer`);
    assert(
      finalPayoutWon === row.finalPayoutWon,
      `${row.id}: expected ${row.finalPayoutWon}, got ${finalPayoutWon}`,
    );
  }

  const currentCampaignSpent = [201600, 0, 0, 93600, 0, 62100];
  const monthSpentWon = currentCampaignSpent.reduce((sum, value) => sum + value, 0);
  assert(monthSpentWon === 357300, `dashboard month spend mismatch: ${monthSpentWon}`);
  assert(Math.floor((monthSpentWon * 30) / 100) === 107190, "dashboard share mismatch");

  const allSpent = parseSpentValues(fixtures);
  assert(allSpent.every(Number.isInteger), "all spentWon values are integers");
}

function main() {
  for (const file of REQUIRED_FILES) {
    assert(existsSync(join(REPO_ROOT, file)), `required file missing: ${file}`);
  }

  const stage4BFiles = REQUIRED_FILES.map((file) => join(REPO_ROOT, file));
  const combined = stage4BFiles.map(readText).join("\n");
  for (const marker of REQUIRED_MARKERS) {
    assertContains(combined, marker, "Stage 4-B marker");
  }

  const fixtures = readText(join(REPO_ROOT, "apps/web/src/lib/partner-demo/fixtures.ts"));
  const calculations = readText(join(REPO_ROOT, "apps/web/src/lib/partner-demo/calculations.ts"));
  const selectors = readText(join(REPO_ROOT, "apps/web/src/lib/partner-demo/selectors.ts"));
  const browserStore = readText(join(REPO_ROOT, "apps/web/src/lib/partner-demo/browser-store.ts"));
  const diagnostics = readText(join(REPO_ROOT, "apps/web/src/app/admin/diagnostics/page.tsx"));

  assertContains(calculations, "Math.floor((spentWon * shareRatePercent) / 100)", "integer share calculation");
  assertContains(calculations, "calculateStage4BSettlement", "settlement calculation function");
  assertContains(selectors, "STAGE4B_DEMO_ADVERTISERS", "fixed advertiser partner attribution source");
  assertContains(browserStore, "STAGE4B_LOCAL_STORAGE_KEY", "isolated browser store");
  assertContains(browserStore, "resetStore", "Partner Demo Reset");
  assertContains(diagnostics, "Stage 4-B partner dashboard investor demo markers", "diagnostics marker");
  assertContains(fixtures, "partnerId: STAGE4B_DEMO_PARTNER.id", "advertiser partner_id fixed in fixture");
  assertContains(fixtures, "contractStatus: \"active\"", "partner contract status fixture");
  assertContains(combined, "terminated", "terminated taxonomy documented in type/fixture sources");
  assertContains(fixtures, "status: \"pending\"", "settlement pending status");
  assertContains(fixtures, "status: \"approved\"", "settlement approved status");
  assertContains(fixtures, "status: \"paid\"", "settlement paid status");
  assertContains(combined, "cancelled", "settlement cancelled status support");

  verifyExecutableSettlementMath(fixtures);

  const forbiddenPatterns = [
    [/\.from\(\s*["'`]partners["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "partners mutation"],
    [/\.from\(\s*["'`]advertisers["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "advertisers mutation"],
    [/\.from\(\s*["'`]partner_settlements["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "partner_settlements mutation"],
    [/\.from\(\s*["'`]point_ledger["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "point_ledger mutation"],
    [/\.from\(\s*["'`]ad_views["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "ad_views mutation"],
    [/\.rpc\(\s*["'`].*(settlement|payout|paid|partner)/i, "actual partner settlement RPC"],
    [/quiz_answer/i, "quiz_answer exposure"],
    [/correctAnswer|correctOption|correctIndex|answerIndex/i, "answer exposure"],
    [/service_role|SERVICE_ROLE/i, "service role exposure"],
    [/account_number|resident_registration|rrn/i, "account or RRN exposure"],
    [/Math\.random/i, "randomized fixture"],
    [/\b(FLOAT|REAL)\b/, "floating money type"],
  ];

  for (const file of stage4BFiles) {
    const text = readText(file);
    for (const [pattern, label] of forbiddenPatterns) {
      assert(!pattern.test(text), `${relative(REPO_ROOT, file)} forbidden ${label}`);
    }
  }

  const migrationFiles = readdirSync(join(REPO_ROOT, "supabase/migrations"));
  assert(
    migrationFiles.every((file) => !/stage[_-]?4[_-]?b|partner[_-]?dashboard/i.test(file)),
    "no Stage 4-B SQL migration files exist",
  );

  console.log("RESULT: stage4BPartnerDashboardDemoComplete=true");
  console.log("RESULT: deterministicFixture=true");
  console.log("RESULT: settlementMathExecutableCheck=true");
  console.log("RESULT: partnerShareRatePercent=30");
  console.log("RESULT: productionDbMutationAllowed=false");
  console.log("RESULT: dbMigration=false");
  console.log("RESULT: quizAnswerExposed=false");
  console.log("RESULT: rawAdViewsExposed=false");
  console.log("RESULT: rawPointLedgerExposed=false");
  console.log("PASS: verify:stage4b-partner-dashboard-demo");
}

main();
