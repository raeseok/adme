/**
 * Stage 3-J-R Prepaid Threshold DB Migration Design Review verification.
 * Design review/admin marker verification only; no migration and no mutation.
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
  "apps/web/src/lib/compliance/stage3jr-prepaid-threshold-db-migration-design-review.ts",
  "docs/adme/stage-3-j-r-prepaid-threshold-db-migration-design-review.md",
  "apps/web/src/app/admin/prepaid-threshold-preflight/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

const REQUIRED_MARKERS = [
  "stage3JRPrepaidThresholdDbMigrationDesignReview=true",
  "stage3JRDbMigrationDesignReviewed=true",
  "stage3JRActualDbMigrationImplemented=false",
  "stage3JRSupabaseDbPushExecuted=false",
  "stage3JRRuntimeThresholdMonitoringImplemented=false",
  "stage3JRCalculationSourceFinalized=false",
  "stage3JRActualProductionThresholdValuesAvailable=false",
  "stage3JRReadOnlyDesignOnly=true",
  "stage3JRThresholdUnknownBlocksIssuance=true",
  "stage3JRHardStopBlocksIssuance=true",
  "stage3JRThresholdExceededBlocksIssuance=true",
  "stage3JRActualRewardOpenAllowed=false",
  "stage3JRControlledOpenExecutionAllowed=false",
  "stage3JRCashOutActualImplementationAllowed=false",
  "stage3JRPartnerSettlementActualImplementationAllowed=false",
  "stage3JRDbMigrationAllowed=false",
  "stage3JRProductionRewardMutation=false",
  "stage3JRProductionPointLedgerMutation=false",
  "stage3JRProductionCashRedemptionRequestsMutation=false",
  "stage3JRProductionPartnerSettlementsMutation=false",
];

const FULL_ADMIN_MARKERS = [
  ...REQUIRED_MARKERS,
  "stage3JRPointLedgerMutationImplemented=false",
  "stage3JRThresholdGuardRpcImplemented=false",
  "stage3JRRecommendedTablesDesigned=true",
  "stage3JRRecommendedRlsDesigned=true",
  "stage3JRRecommendedRpcDesigned=true",
  "stage3JRRecommendedIndexesDesigned=true",
  "stage3JRRecommendedAuditLogsDesigned=true",
  "stage3JRRecommendedAdminPreflightDesigned=true",
  "stage3JRWarningRequiresRegistrationPreparation=true",
  "stage3JRExceededRequiresRegistrationTrack=true",
  "stage3JRQuarterEndOutstandingBalanceLimitKrw=3000000000",
  "stage3JRAnnualTotalIssuedLimitKrw=50000000000",
  "stage3JRWarningRatio=0.8",
  "stage3JRHardStopRatio=0.95",
  "stage3JRProductionCampaignBudgetMutation=false",
  "stage3JRProductionUsersBalanceMutation=false",
  "stage3JRProductionAdViewsMutation=false",
];

const THRESHOLD_PREFLIGHT_VISIBLE_STRINGS = [
  "Prepaid Threshold DB Migration Design Review",
  "DB migration design is reviewed",
  "Actual DB migration is not implemented",
  "Supabase db push is not executed",
  "Runtime threshold monitoring is not implemented",
  "This is read-only design review only",
];

const SUMMARY_VISIBLE_STRINGS = [
  "Stage 3-J-R prepaid threshold DB migration design is reviewed",
  "Actual DB migration is not implemented",
  "Supabase db push is not executed",
  "Runtime threshold monitoring remains blocked",
];

const REQUIRED_DOCUMENT_STRINGS = [
  "DB migration design review only",
  "no DB migration",
  "no Supabase db push",
  "no Production mutation",
  "runtime threshold monitoring is not implemented",
  "actual production threshold values are not available",
  "calculation source is not finalized",
  "threshold unknown blocks issuance",
  "hard stop blocks issuance",
  "threshold exceeded switches to registration track",
];

const REQUIRED_DESIGN_STRINGS = [
  "prepaid_threshold_daily_snapshots",
  "prepaid_threshold_quarter_end_snapshots",
  "prepaid_annual_issuance_aggregates",
  "prepaid_threshold_audit_logs",
  "prepaid_registration_transition_events",
  "unknown_blocked",
  "normal",
  "warning",
  "hard_stop_blocked",
  "exceeded_blocked",
  "registration_track_required",
  "admin read-only",
  "SECURITY DEFINER",
  "source_digest",
];

const DANGEROUS_STRINGS = [
  "stage3JRActualDbMigrationImplemented=true",
  "stage3JRSupabaseDbPushExecuted=true",
  "stage3JRRuntimeThresholdMonitoringImplemented=true",
  "stage3JRCalculationSourceFinalized=true",
  "stage3JRActualProductionThresholdValuesAvailable=true",
  "stage3JRActualRewardOpenAllowed=true",
  "stage3JRDbMigrationAllowed=true",
  "stage3JRProductionRewardMutation=true",
  "Supabase db push completed",
  "production point issuance enabled",
  "actual reward open allowed=true",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3JR",
  "Prepaid Threshold DB Migration Design Review",
  "DB migration design is reviewed",
  "Runtime threshold monitoring is not implemented",
];

const STAGE3JR_POLICY_FILES = [
  join(
    WEB_ROOT,
    "src/lib/compliance/stage3jr-prepaid-threshold-db-migration-design-review.ts",
  ),
  join(WEB_ROOT, "src/app/admin/prepaid-threshold-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(
    REPO_ROOT,
    "docs/adme/stage-3-j-r-prepaid-threshold-db-migration-design-review.md",
  ),
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
      "src/lib/compliance/stage3jr-prepaid-threshold-db-migration-design-review.ts",
    ),
  );
  const doc = readText(
    join(
      REPO_ROOT,
      "docs/adme/stage-3-j-r-prepaid-threshold-db-migration-design-review.md",
    ),
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

  assertContains(ssot, 'import "server-only"', "Stage 3-J-R SSOT server-only");
  assertContains(
    ssot,
    "getStage3JRPrepaidThresholdDbMigrationDesignReviewState",
    "Stage 3-J-R SSOT function",
  );

  for (const marker of FULL_ADMIN_MARKERS) {
    const [key, value] = marker.split("=");
    assertContains(ssot, `${key}: ${value}`, `Stage 3-J-R SSOT ${key}`);
  }

  for (const required of REQUIRED_DOCUMENT_STRINGS) {
    assertContains(doc, required, "Stage 3-J-R required conservative phrase");
  }

  for (const required of REQUIRED_DESIGN_STRINGS) {
    assertContains(doc, required, "Stage 3-J-R required DB design element");
  }

  for (const required of THRESHOLD_PREFLIGHT_VISIBLE_STRINGS) {
    assertContains(
      thresholdPage,
      required,
      "Stage 3-J-R threshold preflight visible string",
    );
  }

  for (const required of SUMMARY_VISIBLE_STRINGS) {
    assertContains(compliancePage, required, "compliance-preflight Stage 3-J-R summary");
    assertContains(diagnostics, required, "diagnostics Stage 3-J-R summary");
  }

  assertContains(
    productPolicy,
    "Stage 3-J-R Prepaid Threshold DB Migration Design Review",
    "product policy Stage 3-J-R",
  );
  assertContains(
    roadmap,
    "verify:stage3jr-prepaid-threshold-db-migration-design-review",
    "roadmap Stage 3-J-R verify",
  );
  assertContains(decisionLog, "ADME-DECISION-20260709-016", "decision log Stage 3-J-R");

  for (const [label, text] of [
    ["Stage 3-J-R SSOT", ssot],
    ["Stage 3-J-R doc", doc],
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

  for (const file of STAGE3JR_POLICY_FILES) {
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
    assertNotContains(file, "stage_3_j_r", "no Stage 3-J-R DB migration file");
    assertNotContains(file, "stage3jr", "no Stage 3-J-R DB migration file");
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
          "stage3JRPrepaidThresholdDbMigrationDesignReview",
        );

  const visible =
    path === "/admin/prepaid-threshold-preflight"
      ? THRESHOLD_PREFLIGHT_VISIBLE_STRINGS
      : SUMMARY_VISIBLE_STRINGS;
  assertMarkerList(sources.combined, visible, `${path} Stage 3-J-R visible strings`);
  assertMarkerList(sources.combined, FULL_ADMIN_MARKERS, `${path} Stage 3-J-R markers`);

  const commit = extractMarkerValue(sources.combined, "stage3JRDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3JRDeployCommit=${commit}`);
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
  console.log("RESULT: supabaseDbPush=false");
  console.log("RESULT: productionMutation=false");
  console.log("PASS: verify:stage3jr-prepaid-threshold-db-migration-design-review");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
