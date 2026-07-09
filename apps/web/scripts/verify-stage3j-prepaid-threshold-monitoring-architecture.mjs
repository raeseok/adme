/**
 * Stage 3-J Prepaid Threshold Monitoring Architecture verification.
 * Read-only architecture/SSOT/admin marker/evaluator verification only.
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
  "apps/web/src/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture.ts",
  "apps/web/src/lib/compliance/prepaid-threshold-evaluator.ts",
  "apps/web/src/app/admin/prepaid-threshold-preflight/page.tsx",
  "docs/adme/stage-3-j-prepaid-threshold-monitoring-architecture.md",
];

const REQUIRED_MARKERS = [
  "stage3JPrepaidThresholdMonitoringArchitectureDesign=true",
  "stage3JThresholdMonitoringArchitectureDesigned=true",
  "stage3JThresholdRuntimeMonitoringImplemented=false",
  "stage3JThresholdDbMigrationImplemented=false",
  "stage3JActualProductionThresholdValuesAvailable=false",
  "stage3JCalculationSourceFinalized=false",
  "stage3JThresholdUnknownBlocksIssuance=true",
  "stage3JHardStopBlocksIssuance=true",
  "stage3JThresholdExceededBlocksIssuance=true",
  "stage3JActualRewardOpenAllowed=false",
  "stage3JControlledOpenExecutionAllowed=false",
  "stage3JCashOutActualImplementationAllowed=false",
  "stage3JPartnerSettlementActualImplementationAllowed=false",
  "stage3JDbMigrationAllowed=false",
  "stage3JProductionRewardMutation=false",
  "stage3JProductionPointLedgerMutation=false",
  "stage3JProductionCashRedemptionRequestsMutation=false",
  "stage3JProductionPartnerSettlementsMutation=false",
];

const FULL_ADMIN_MARKERS = [
  ...REQUIRED_MARKERS,
  "stage3JThresholdAdminDashboardActualDataImplemented=false",
  "stage3JThresholdPreflightPlaceholderImplemented=true",
  "stage3JQuarterEndOutstandingBalanceLimitKrw=3000000000",
  "stage3JAnnualTotalIssuedLimitKrw=50000000000",
  "stage3JBothLimitsMustRemainBelow=true",
  "stage3JWarningRatio=0.8",
  "stage3JHardStopRatio=0.95",
  "stage3JQuarterEndOutstandingBalanceWarningKrw=2400000000",
  "stage3JQuarterEndOutstandingBalanceHardStopKrw=2850000000",
  "stage3JAnnualTotalIssuedWarningKrw=40000000000",
  "stage3JAnnualTotalIssuedHardStopKrw=47500000000",
  "stage3JWarningRequiresRegistrationPreparation=true",
  "stage3JExceededRequiresRegistrationTrack=true",
  "stage3JDailyAggregationRequired=true",
  "stage3JQuarterEndSnapshotRequired=true",
  "stage3JAnnualIssuedAggregationRequired=true",
  "stage3JReconciliationRequiredBeforeActualOpen=true",
  "stage3JProductionCampaignBudgetMutation=false",
  "stage3JProductionUsersBalanceMutation=false",
  "stage3JProductionAdViewsMutation=false",
];

const REQUIRED_VISIBLE_STRINGS = [
  "Prepaid Threshold Monitoring Architecture",
  "Threshold monitoring architecture is designed",
  "Runtime threshold monitoring is not implemented",
  "Actual production threshold values are not available",
  "Calculation source is not finalized",
  "Threshold unknown blocks issuance",
  "Hard stop blocks issuance",
  "Threshold exceeded switches to registration track",
  "Actual reward open remains blocked",
  "No production reward mutation",
  "No DB migration in Stage 3-J",
];

const SUMMARY_VISIBLE_STRINGS = [
  "Stage 3-J prepaid threshold monitoring architecture is designed",
  "Runtime monitoring is not implemented",
  "Actual reward open remains blocked",
];

const DANGEROUS_STRINGS = [
  "stage3JThresholdRuntimeMonitoringImplemented=true",
  "stage3JThresholdDbMigrationImplemented=true",
  "stage3JActualProductionThresholdValuesAvailable=true",
  "stage3JCalculationSourceFinalized=true",
  "stage3JActualRewardOpenAllowed=true",
  "stage3JControlledOpenExecutionAllowed=true",
  "stage3JDbMigrationAllowed=true",
  "stage3JProductionRewardMutation=true",
  "actual issuance allowed",
  "threshold monitoring implemented",
  "DB migration completed",
  "production point issuance enabled",
];

const REQUIRED_DOCUMENT_STRINGS = [
  "threshold monitoring architecture only",
  "no DB migration",
  "no Production mutation",
  "actual production threshold values are not available in Stage 3-J",
  "calculation source is not finalized in Stage 3-J",
  "threshold unknown blocks issuance",
  "hard stop blocks issuance",
  "threshold exceeded switches to registration track",
  "actual reward open remains blocked",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3J",
  "Prepaid Threshold Monitoring Architecture",
  "Threshold monitoring architecture is designed",
  "Runtime threshold monitoring is not implemented",
  "Threshold unknown blocks issuance",
];

const STAGE3J_POLICY_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture.ts"),
  join(WEB_ROOT, "src/lib/compliance/prepaid-threshold-evaluator.ts"),
  join(WEB_ROOT, "src/app/admin/prepaid-threshold-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-j-prepaid-threshold-monitoring-architecture.md"),
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
    join(WEB_ROOT, "src/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture.ts"),
  );
  const evaluator = readText(
    join(WEB_ROOT, "src/lib/compliance/prepaid-threshold-evaluator.ts"),
  );
  const doc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-j-prepaid-threshold-monitoring-architecture.md"),
  );
  const thresholdPage = readText(
    join(WEB_ROOT, "src/app/admin/prepaid-threshold-preflight/page.tsx"),
  );
  const compliancePage = readText(
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  );
  const diagnostics = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-J SSOT server-only");
  assertContains(
    ssot,
    "getStage3JPrepaidThresholdMonitoringArchitectureState",
    "Stage 3-J SSOT function",
  );

  for (const marker of FULL_ADMIN_MARKERS) {
    const [key, value] = marker.split("=");
    assertContains(ssot, `${key}: ${value}`, `Stage 3-J SSOT ${key}`);
  }

  for (const required of REQUIRED_DOCUMENT_STRINGS) {
    assertContains(doc, required, "Stage 3-J required conservative phrase");
  }

  for (const required of REQUIRED_VISIBLE_STRINGS) {
    assertContains(thresholdPage, required, "Stage 3-J threshold preflight visible string");
  }

  for (const required of SUMMARY_VISIBLE_STRINGS) {
    assertContains(compliancePage, required, "compliance-preflight Stage 3-J summary");
    assertContains(diagnostics, required, "diagnostics Stage 3-J summary");
  }

  assertContains(
    evaluator,
    "evaluatePrepaidThresholdGate",
    "Stage 3-J evaluator function",
  );
  for (const status of [
    "unknown_blocked",
    "normal",
    "warning",
    "hard_stop_blocked",
    "exceeded_blocked",
  ]) {
    assertContains(evaluator, status, `Stage 3-J evaluator status ${status}`);
  }
  for (const threshold of [
    "QUARTER_END_OUTSTANDING_BALANCE_LIMIT_KRW = 3000000000",
    "ANNUAL_TOTAL_ISSUED_LIMIT_KRW = 50000000000",
    "WARNING_RATIO = 0.8",
    "HARD_STOP_RATIO = 0.95",
  ]) {
    assertContains(evaluator, threshold, `Stage 3-J evaluator constant ${threshold}`);
  }

  assertContains(
    productPolicy,
    "Stage 3-J Prepaid Threshold Monitoring Architecture Design",
    "product policy Stage 3-J",
  );
  assertContains(
    roadmap,
    "verify:stage3j-prepaid-threshold-monitoring-architecture",
    "roadmap Stage 3-J verify",
  );
  assertContains(decisionLog, "ADME-DECISION-20260709-015", "decision log Stage 3-J");

  for (const [label, text] of [
    ["Stage 3-J SSOT", ssot],
    ["Stage 3-J evaluator", evaluator],
    ["Stage 3-J doc", doc],
    ["threshold preflight", thresholdPage],
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

function evaluatePrepaidThresholdGateForVerification({
  quarterEndOutstandingBalanceKrw,
  annualTotalIssuedKrw,
}) {
  if (quarterEndOutstandingBalanceKrw === null || annualTotalIssuedKrw === null) {
    return "unknown_blocked";
  }
  if (quarterEndOutstandingBalanceKrw >= 3000000000) return "exceeded_blocked";
  if (annualTotalIssuedKrw >= 50000000000) return "exceeded_blocked";
  if (quarterEndOutstandingBalanceKrw >= 2850000000) return "hard_stop_blocked";
  if (annualTotalIssuedKrw >= 47500000000) return "hard_stop_blocked";
  if (quarterEndOutstandingBalanceKrw >= 2400000000) return "warning";
  if (annualTotalIssuedKrw >= 40000000000) return "warning";
  return "normal";
}

function verifyEvaluatorCases() {
  const cases = [
    [null, null, "unknown_blocked", "null/null"],
    [0, 0, "normal", "0/0"],
    [2400000000, 0, "warning", "2,400,000,000 / 0"],
    [0, 40000000000, "warning", "0 / 40,000,000,000"],
    [2850000000, 0, "hard_stop_blocked", "2,850,000,000 / 0"],
    [0, 47500000000, "hard_stop_blocked", "0 / 47,500,000,000"],
    [3000000000, 0, "exceeded_blocked", "3,000,000,000 / 0"],
    [0, 50000000000, "exceeded_blocked", "0 / 50,000,000,000"],
  ];

  for (const [
    quarterEndOutstandingBalanceKrw,
    annualTotalIssuedKrw,
    expected,
    label,
  ] of cases) {
    const actual = evaluatePrepaidThresholdGateForVerification({
      quarterEndOutstandingBalanceKrw,
      annualTotalIssuedKrw,
    });
    if (actual !== expected) {
      throw new Error(`evaluator case ${label}: expected ${expected}, got ${actual}`);
    }
    console.log(`RESULT: evaluator ${label}=${actual}`);
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

  for (const file of STAGE3J_POLICY_FILES) {
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
    assertNotContains(file, "stage_3_j", "no Stage 3-J DB migration file");
    assertNotContains(file, "prepaid_threshold", "no prepaid threshold DB migration file");
  }

  const statusAdded = gitLines("git status --porcelain -- supabase/migrations");
  const diffAdded = gitLines("git diff --name-only --diff-filter=A HEAD -- supabase/migrations");
  const added = [...statusAdded, ...diffAdded].filter((line) =>
    line.includes("supabase/migrations"),
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
          "stage3JPrepaidThresholdMonitoringArchitectureDesign",
        );

  const visible =
    path === "/admin/prepaid-threshold-preflight"
      ? REQUIRED_VISIBLE_STRINGS
      : SUMMARY_VISIBLE_STRINGS;
  assertMarkerList(sources.combined, visible, `${path} Stage 3-J visible strings`);
  assertMarkerList(sources.combined, FULL_ADMIN_MARKERS, `${path} Stage 3-J markers`);

  const commit = extractMarkerValue(sources.combined, "stage3JDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3JDeployCommit=${commit}`);
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
    "/admin/prepaid-threshold-preflight",
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
  console.log("PASS: verify:stage3j-prepaid-threshold-monitoring-architecture");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
