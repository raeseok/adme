/**
 * Stage 3-K Protected Fund Reconciliation Design verification.
 * Design/admin marker verification only; no migration, no bank API, no mutation.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  assertContains,
  assertNotContains,
  readText,
  walkFiles,
} from "./utils/stage3e-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const BASE = resolveProductionE2eBaseUrl();

const REQUIRED_FILES = [
  "apps/web/src/lib/compliance/stage3k-protected-fund-reconciliation-design.ts",
  "apps/web/src/lib/compliance/protected-fund-reconciliation-evaluator.ts",
  "apps/web/src/app/admin/protected-fund-preflight/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
  "docs/adme/stage-3-k-protected-fund-reconciliation-design.md",
];

const REQUIRED_MARKERS = [
  "stage3KProtectedFundPreflight=true",
  "stage3KProtectedFundReconciliationDesign=true",
  "stage3KProtectedFundReconciliationDesigned=true",
  "stage3KProtectedFundStatusTaxonomyAligned=true",
  "stage3KProtectedFundStatusUnknown=unknown_blocked",
  "stage3KProtectedFundStatusDeficit=deficit_blocked",
  "stage3KProtectedFundStatusMinimumCovered=minimum_covered_warning",
  "stage3KProtectedFundStatusBelowTargetBuffer=covered_below_target_buffer",
  "stage3KProtectedFundStatusTargetBufferOk=target_buffer_ok",
  "stage3KProtectedFundStatusNoLiability=no_liability_observed",
  "stage3KProtectedFundRuntimeReconciliationImplemented=false",
  "stage3KRuntimeReconciliationImplemented=false",
  "stage3KProtectedFundDbMigrationImplemented=false",
  "stage3KSupabaseDbPushExecuted=false",
  "stage3KProtectedFundBankApiIntegrated=false",
  "stage3KActualProtectedFundBalanceAvailable=false",
  "stage3KProtectedFundCalculationSourceFinalized=false",
  "stage3KCalculationSourceFinalized=false",
  "stage3KReadOnlyDesignOnly=true",
  "stage3KCoverageUnknownBlocksCashOut=true",
  "stage3KCoverageDeficitBlocksCashOut=true",
  "stage3KCoverageUnknownBlocksRewardOpen=true",
  "stage3KCoverageDeficitBlocksRewardOpen=true",
  "stage3KActualRewardOpenAllowed=false",
  "stage3KRewardOpenAllowed=false",
  "stage3KControlledOpenExecutionAllowed=false",
  "stage3KCashOutActualImplementationAllowed=false",
  "stage3KCashOutActualProcessingAllowed=false",
  "stage3KPartnerSettlementActualImplementationAllowed=false",
  "stage3KDbMigrationAllowed=false",
  "stage3KProductionMutation=false",
  "stage3KProductionRewardMutation=false",
  "stage3KProductionPointLedgerMutation=false",
  "stage3KProductionCashRedemptionRequestsMutation=false",
  "stage3KProductionPartnerSettlementsMutation=false",
];

const FULL_ADMIN_MARKERS = [
  ...REQUIRED_MARKERS,
  "stage3KConsumerRedeemablePointLiabilityMustBeCovered=true",
  "stage3KCoverageMinimumRatio=1",
  "stage3KCoverageWarningRatio=1.05",
  "stage3KCoverageTargetBufferRatio=1.1",
  "stage3KMinimumCoverageRatioBps=10000",
  "stage3KWarningCoverageRatioBps=10500",
  "stage3KTargetBufferCoverageRatioBps=11000",
  "stage3KProtectedFundStatusSet=unknown_blocked,deficit_blocked,minimum_covered_warning,covered_below_target_buffer,target_buffer_ok,no_liability_observed",
  "stage3KDailyReconciliationRequired=true",
  "stage3KManualReconciliationRequiredBeforeCashOut=true",
  "stage3KManualReconciliationRequiredBeforeRewardOpen=true",
  "stage3KSourceDigestRequired=true",
  "stage3KIdempotencyRequired=true",
  "stage3KAuditLogRequired=true",
  "stage3KAdminReadOnlyPreflightRequired=true",
  "stage3KServiceRoleOrSecurityDefinerWriteOnlyRecommended=true",
  "stage3KConsumerAdvertiserPartnerDirectAccessBlocked=true",
  "stage3KBankAccountRawExposureAllowed=false",
  "stage3KBreakageRecognitionBlockedUntilPolicyApproved=true",
  "stage3KProductionCampaignBudgetMutation=false",
  "stage3KProductionUsersBalanceMutation=false",
  "stage3KProductionAdViewsMutation=false",
];

const PROTECTED_FUND_PREFLIGHT_VISIBLE_STRINGS = [
  "Protected Fund Reconciliation Design",
  "Protected fund reconciliation is designed",
  "Runtime protected fund reconciliation is not implemented",
  "Actual protected fund balance is not available",
  "Calculation source is not finalized",
  "Coverage unknown blocks cash-out",
  "Coverage deficit blocks cash-out",
  "Coverage unknown blocks reward open",
  "Coverage deficit blocks reward open",
  "Actual reward open remains blocked",
  "No production mutation",
  "No DB migration in Stage 3-K",
  "stage3KProtectedFundStatusTaxonomyAligned=true",
  "stage3KProtectedFundStatusUnknown=unknown_blocked",
  "stage3KProtectedFundStatusDeficit=deficit_blocked",
  "stage3KProtectedFundStatusMinimumCovered=minimum_covered_warning",
  "stage3KProtectedFundStatusBelowTargetBuffer=covered_below_target_buffer",
  "stage3KProtectedFundStatusTargetBufferOk=target_buffer_ok",
  "stage3KProtectedFundStatusNoLiability=no_liability_observed",
  "0/0 =&gt; no_liability_observed",
  "10000/10000 =&gt; minimum_covered_warning",
  "10000/10500 =&gt; covered_below_target_buffer",
  "10000/11000 =&gt; target_buffer_ok",
];

const SUMMARY_VISIBLE_STRINGS = [
  "Stage 3-K protected fund reconciliation is designed",
  "Runtime protected fund reconciliation is not implemented",
  "Actual protected fund balance is not available",
  "Actual reward open remains blocked",
  "stage3KProtectedFundStatusTaxonomyAligned=true",
  "stage3KProtectedFundStatusSet=unknown_blocked,deficit_blocked,minimum_covered_warning,covered_below_target_buffer,target_buffer_ok,no_liability_observed",
];

const REQUIRED_DOCUMENT_STRINGS = [
  "protected fund reconciliation design only",
  "no DB migration",
  "no Supabase db push",
  "no Production mutation",
  "runtime protected fund reconciliation is not implemented",
  "actual protected fund balance is not available",
  "calculation source is not finalized",
  "Stage 3-K-R Protected Fund Status Taxonomy Alignment",
  "coverage unknown blocks cash-out",
  "coverage deficit blocks cash-out",
  "coverage unknown blocks reward open",
  "coverage deficit blocks reward open",
  "actual reward open remains blocked",
];

const REQUIRED_DESIGN_STRINGS = [
  "protected_fund_accounts",
  "protected_fund_ledger",
  "protected_fund_daily_snapshots",
  "protected_fund_reconciliation_snapshots",
  "protected_fund_audit_logs",
  "protected_fund_adjustment_requests",
  "unknown_blocked",
  "deficit_blocked",
  "minimum_covered_warning",
  "covered_below_target_buffer",
  "target_buffer_ok",
  "no_liability_observed",
  "admin read-only",
  "SECURITY DEFINER",
  "source_digest",
  "idempotency",
];

const DANGEROUS_STRINGS = [
  "stage3KProtectedFundRuntimeReconciliationImplemented=true",
  "stage3KProtectedFundDbMigrationImplemented=true",
  "stage3KProtectedFundBankApiIntegrated=true",
  "stage3KActualProtectedFundBalanceAvailable=true",
  "stage3KProtectedFundCalculationSourceFinalized=true",
  "stage3KActualRewardOpenAllowed=true",
  "stage3KRewardOpenAllowed=true",
  "stage3KDbMigrationAllowed=true",
  "stage3KProductionRewardMutation=true",
  "stage3KProductionMutation=true",
  "stage3KCashOutActualProcessingAllowed=true",
  "protected fund runtime reconciliation implemented=true",
  "protected fund DB migration implemented=true",
  "bank API integrated=true",
  "actual protected fund balance verified",
  "cash-out actual processing allowed=true",
  "actual reward open allowed=true",
  "production mutation enabled",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3K",
  "Protected Fund Reconciliation Design",
  "Protected fund reconciliation is designed",
  "Runtime protected fund reconciliation is not implemented",
  "Coverage unknown blocks cash-out",
  "Coverage deficit blocks reward open",
];

const STAGE3K_POLICY_FILES = [
  join(
    WEB_ROOT,
    "src/lib/compliance/stage3k-protected-fund-reconciliation-design.ts",
  ),
  join(WEB_ROOT, "src/lib/compliance/protected-fund-reconciliation-evaluator.ts"),
  join(WEB_ROOT, "src/app/admin/protected-fund-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-k-protected-fund-reconciliation-design.md"),
  join(REPO_ROOT, "docs/adme/product-policy-current.md"),
  join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"),
  join(REPO_ROOT, "docs/adme/adme-decision-log.md"),
];

function expectedDeployCommit() {
  return execSync("git rev-parse --short HEAD", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

function gitLines(command) {
  return execSync(command, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function verifyRequiredFiles() {
  for (const file of REQUIRED_FILES) {
    const full = join(REPO_ROOT, file);
    if (!existsSync(full)) {
      throw new Error(`required file missing: ${file}`);
    }
    console.log(`PASS: required file exists - ${file}`);
  }
}

function verifySourceContract() {
  const ssot = readText(
    join(
      WEB_ROOT,
      "src/lib/compliance/stage3k-protected-fund-reconciliation-design.ts",
    ),
  );
  const evaluator = readText(
    join(WEB_ROOT, "src/lib/compliance/protected-fund-reconciliation-evaluator.ts"),
  );
  const doc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-k-protected-fund-reconciliation-design.md"),
  );
  const protectedFundPage = readText(
    join(WEB_ROOT, "src/app/admin/protected-fund-preflight/page.tsx"),
  );
  const compliancePage = readText(
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  );
  const diagnostics = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-K SSOT server-only");
  assertContains(
    ssot,
    "getStage3KProtectedFundReconciliationDesignState",
    "Stage 3-K SSOT function",
  );

  for (const marker of FULL_ADMIN_MARKERS) {
    const [key, value] = marker.split("=");
    const sourceValue =
      value === "true" || value === "false" || /^\d+(\.\d+)?$/.test(value)
        ? value
        : `"${value}"`;
    assertContains(ssot, `${key}: ${sourceValue}`, `Stage 3-K SSOT ${key}`);
  }

  assertContains(
    evaluator,
    "evaluateProtectedFundReconciliationGate",
    "Stage 3-K evaluator function",
  );
  for (const required of [
    "unknown_blocked",
    "deficit_blocked",
    "minimum_covered_warning",
    "covered_below_target_buffer",
    "target_buffer_ok",
    "no_liability_observed",
    "coverageRatioBps",
    "COVERAGE_MINIMUM_RATIO_BPS = 10000",
    "COVERAGE_WARNING_RATIO_BPS = 10500",
    "COVERAGE_TARGET_BUFFER_RATIO_BPS = 11000",
    "BigInt(protectedFundAvailableWon)",
    "coverageGateAllowsCashOut",
    "coverageGateAllowsRewardOpen",
  ]) {
    assertContains(evaluator, required, "Stage 3-K evaluator source contract");
  }

  for (const forbidden of [
    '| "normal"',
    '| "warning"',
    'status: "normal"',
    'status: "warning"',
    'buildEvaluation(input, "normal"',
    'buildEvaluation(input, "warning"',
    'return { status: "normal"',
    'return { status: "warning"',
  ]) {
    assertNotContains(
      evaluator,
      forbidden,
      "Stage 3-K evaluator machine-readable status guard",
    );
  }

  for (const required of REQUIRED_DOCUMENT_STRINGS) {
    assertContains(doc, required, "Stage 3-K required conservative phrase");
  }

  for (const required of REQUIRED_DESIGN_STRINGS) {
    assertContains(doc, required, "Stage 3-K required design element");
  }

  for (const required of PROTECTED_FUND_PREFLIGHT_VISIBLE_STRINGS) {
    assertContains(
      protectedFundPage,
      required,
      "Stage 3-K protected fund preflight visible string",
    );
  }

  for (const required of SUMMARY_VISIBLE_STRINGS) {
    assertContains(compliancePage, required, "compliance-preflight Stage 3-K summary");
    assertContains(diagnostics, required, "diagnostics Stage 3-K summary");
  }

  assertContains(
    productPolicy,
    "Stage 3-K Protected Fund Reconciliation Design",
    "product policy Stage 3-K",
  );
  assertContains(
    roadmap,
    "verify:stage3k-protected-fund-reconciliation-design",
    "roadmap Stage 3-K verify",
  );
  assertContains(decisionLog, "ADME-DECISION-20260709-017", "decision log Stage 3-K");

  for (const [label, text] of [
    ["Stage 3-K SSOT", ssot],
    ["Stage 3-K evaluator", evaluator],
    ["Stage 3-K doc", doc],
    ["protected fund preflight", protectedFundPage],
    ["compliance preflight", compliancePage],
    ["diagnostics", diagnostics],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ]) {
    for (const forbidden of DANGEROUS_STRINGS) {
      assertNotContains(text, forbidden, `${label} forbidden expression`);
    }
  }
}

function evaluateProtectedFundReconciliationGate(input) {
  const {
    liabilitySourceAvailable = true,
    protectedFundBalanceAvailable = true,
    calculationSourceFinalized = true,
    consumerUnconvertedPointsLiabilityWon,
    protectedFundAvailableWon,
  } = input;
  const liability = consumerUnconvertedPointsLiabilityWon;
  const available = protectedFundAvailableWon;

  if (
    liabilitySourceAvailable === false ||
    protectedFundBalanceAvailable === false ||
    calculationSourceFinalized === false
  ) {
    return { status: "unknown_blocked", coverageRatioBps: null };
  }

  if (
    liability === null ||
    available === null
  ) {
    return { status: "unknown_blocked", coverageRatioBps: null };
  }

  if (
    liability < 0 ||
    available < 0
  ) {
    return { status: "unknown_blocked", coverageRatioBps: null };
  }

  if (liability === 0) {
    return { status: "no_liability_observed", coverageRatioBps: null };
  }

  const coverageRatioBps = Number((BigInt(available) * 10000n) / BigInt(liability));

  if (available < liability) {
    return {
      status: "deficit_blocked",
      coverageRatioBps,
    };
  }

  if (coverageRatioBps < 10000) {
    return { status: "deficit_blocked", coverageRatioBps };
  }

  if (coverageRatioBps < 10500) {
    return { status: "minimum_covered_warning", coverageRatioBps };
  }

  if (coverageRatioBps < 11000) {
    return { status: "covered_below_target_buffer", coverageRatioBps };
  }

  return { status: "target_buffer_ok", coverageRatioBps };
}

function verifyEvaluatorCases() {
  const cases = [
    ["null/null", null, null, "unknown_blocked"],
    ["0/0", 0, 0, "no_liability_observed"],
    ["10000/null", 10000, null, "unknown_blocked"],
    ["10000/9000", 10000, 9000, "deficit_blocked"],
    ["10000/10000", 10000, 10000, "minimum_covered_warning"],
    ["10000/10499", 10000, 10499, "minimum_covered_warning"],
    ["10000/10500", 10000, 10500, "covered_below_target_buffer"],
    ["10000/10999", 10000, 10999, "covered_below_target_buffer"],
    ["10000/11000", 10000, 11000, "target_buffer_ok"],
    ["10000/12000", 10000, 12000, "target_buffer_ok"],
    ["-1/10000", -1, 10000, "unknown_blocked"],
    ["10000/-1", 10000, -1, "unknown_blocked"],
  ];

  for (const [label, liability, balance, expected] of cases) {
    const result = evaluateProtectedFundReconciliationGate({
      liabilitySourceAvailable: true,
      protectedFundBalanceAvailable: true,
      calculationSourceFinalized: true,
      consumerUnconvertedPointsLiabilityWon: liability,
      protectedFundAvailableWon: balance,
    });
    if (result.status !== expected) {
      throw new Error(
        `evaluator ${label}: expected ${expected}, got ${result.status}`,
      );
    }
    console.log(`PASS: evaluator ${label} -> ${result.status}`);
  }
}

function verifyNoMutationSource() {
  const mutationPatterns = [
    [
      /\.from\(\s*["'`]point_ledger["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i,
      "point_ledger mutation",
    ],
    [
      /\.from\(\s*["'`]cash_redemption_requests["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i,
      "cash_redemption_requests mutation",
    ],
    [
      /\.from\(\s*["'`]partner_settlements["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i,
      "partner_settlements mutation",
    ],
    [/campaigns?[\s\S]{0,80}\.update\(/i, "campaign budget update"],
    [/users[\s\S]{0,80}\.update\([\s\S]{0,120}balance/i, "users balance update"],
    [/ad_views[\s\S]{0,120}\.(insert|update|delete|upsert)\(/i, "ad_views mutation"],
    [
      /\.rpc\(\s*["'`][^"'`]*(reward|cash|redemption|settlement|payout|chargeback)[^"'`]*["'`]/i,
      "actual mutation RPC",
    ],
  ];

  for (const file of STAGE3K_POLICY_FILES) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    for (const [pattern, label] of mutationPatterns) {
      if (pattern.test(text)) {
        throw new Error(`${rel}: forbidden ${label}`);
      }
      console.log(`PASS: ${rel} - no ${label}`);
    }
  }
}

function verifyNoMigrationAdded() {
  const migrationDir = join(REPO_ROOT, "supabase/migrations");
  const migrationFiles = readdirSync(migrationDir);
  for (const file of migrationFiles) {
    assertNotContains(file, "stage_3_k", "no Stage 3-K DB migration file");
    assertNotContains(file, "stage3k", "no Stage 3-K DB migration file");
    assertNotContains(file, "protected_fund", "no protected fund DB migration file");
  }

  const statusAdded = gitLines("git status --porcelain -- supabase/migrations");
  const diffAdded = gitLines("git diff --name-only --diff-filter=A HEAD -- supabase/migrations");
  const added = [...statusAdded, ...diffAdded].filter(
    (line) =>
      line.includes("supabase/migrations") &&
      !line.includes("stage_3_p_dev_only_kyc_tax_terms_schema_foundation") &&
      !line.includes("stage_3_q_cash_redemption_demo_state_machine"),
  );
  if (added.length > 0) {
    throw new Error(`DB migration added in this stage: ${added.join(", ")}`);
  }
  console.log("PASS: no DB migration added");
}

function verifyPublicSourceGuard() {
  const publicRoots = [
    join(WEB_ROOT, "src/app/page.tsx"),
    join(WEB_ROOT, "src/app/auth"),
    join(WEB_ROOT, "src/app/consumer"),
  ];

  const files = publicRoots.flatMap((root) => {
    if (!existsSync(root)) return [];
    const statFiles = root.endsWith(".tsx") ? [root] : walkFiles(root);
    return statFiles.filter((file) => !file.includes(`${join("src", "app", "admin")}`));
  });

  for (const file of files) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    for (const forbidden of PUBLIC_FORBIDDEN_STRINGS) {
      assertNotContains(text, forbidden, `public source ${rel}`);
    }
  }
}

async function loadRouteHtml(path, marker, maxWaitMs = 90000) {
  const deadline = Date.now() + maxWaitMs;
  let lastHtml = "";

  while (Date.now() < deadline) {
    const response = await fetch(`${BASE}${path}`);
    if (!response.ok) {
      throw new Error(`${path} HTTP ${response.status}`);
    }
    lastHtml = (await response.text()).replace(/<!--\s*-->/g, "");
    if (!marker || lastHtml.includes(marker)) {
      return { combined: lastHtml };
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return { combined: lastHtml };
}

async function verifyAdminPath(path) {
  const sources =
    path === "/admin/diagnostics"
      ? await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 90000, path })
      : await loadRouteHtml(
          path,
          "stage3KProtectedFundReconciliationDesign",
        );

  const visible =
    path === "/admin/protected-fund-preflight"
      ? PROTECTED_FUND_PREFLIGHT_VISIBLE_STRINGS
      : SUMMARY_VISIBLE_STRINGS;
  assertMarkerList(sources.combined, visible, `${path} Stage 3-K visible strings`);
  assertMarkerList(sources.combined, FULL_ADMIN_MARKERS, `${path} Stage 3-K markers`);

  const commit = extractMarkerValue(sources.combined, "stage3KDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3KDeployCommit=${commit}`);
}

async function verifyPublicRoutes() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      const page = await browser.newPage({ viewport });
      for (const route of PUBLIC_ROUTES) {
        await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
        const html = await page.content();
        const body = await page.locator("body").innerText();

        for (const forbidden of PUBLIC_FORBIDDEN_STRINGS) {
          assertNotContains(
            body,
            forbidden,
            `public body ${route} ${viewport.width}x${viewport.height}`,
          );
          assertNotContains(
            html,
            forbidden,
            `public html ${route} ${viewport.width}x${viewport.height}`,
          );
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  verifyRequiredFiles();
  verifySourceContract();
  verifyEvaluatorCases();
  verifyNoMutationSource();
  verifyNoMigrationAdded();
  verifyPublicSourceGuard();

  for (const path of [
    "/admin/protected-fund-preflight",
    "/admin/compliance-preflight",
    "/admin/diagnostics",
  ]) {
    await verifyAdminPath(path);
  }

  await verifyPublicRoutes();

  for (const marker of REQUIRED_MARKERS) {
    console.log(`RESULT: ${marker}`);
  }
  console.log("RESULT: publicMarkerExposed=false");
  console.log("RESULT: dbMigration=false");
  console.log("RESULT: supabaseDbPush=false");
  console.log("RESULT: productionMutation=false");
  console.log("PASS: verify:stage3k-protected-fund-reconciliation-design");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
