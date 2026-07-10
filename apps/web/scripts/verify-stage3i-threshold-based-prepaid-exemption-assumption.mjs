/**
 * Stage 3-I Threshold-Based Prepaid Registration Exemption Assumption verification.
 * Read-only policy/SSOT/admin marker verification only.
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
  "apps/web/src/lib/compliance/stage3i-threshold-based-prepaid-exemption-assumption.ts",
  "docs/adme/stage-3-i-threshold-based-prepaid-exemption-assumption.md",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

const REQUIRED_MARKERS = [
  "stage3IThresholdBasedPrepaidExemptionAssumption=true",
  "stage3IPrepaidBusinessInitialRegistrationRequired=false",
  "stage3IPrepaidBusinessInitialRegistrationExemptionAssumed=true",
  "stage3IPrepaidBusinessRegistrationStatus=not_registered",
  "stage3IPrepaidExemptionConditionQuarterEndOutstandingBalanceLimitKrw=3000000000",
  "stage3IPrepaidExemptionConditionAnnualTotalIssuedLimitKrw=50000000000",
  "stage3IPrepaidExemptionRequiresBothLimitsBelow=true",
  "stage3IPrepaidThresholdMonitoringRequired=true",
  "stage3IPrepaidDailyInternalMonitoringRequired=true",
  "stage3IPrepaidQuarterEndSnapshotRequired=true",
  "stage3IPrepaidAnnualIssuedAggregationRequired=true",
  "stage3IPrepaidThresholdWarningRatio=0.8",
  "stage3IPrepaidThresholdHardStopRatio=0.95",
  "stage3IPrepaidRegistrationPreparationRequiredAtWarning=true",
  "stage3IPrepaidRegistrationRequiredWhenThresholdExceeded=true",
  "stage3IPrepaidIssuanceBlockedWhenThresholdUnknown=true",
  "stage3IPrepaidIssuanceBlockedWhenThresholdExceeded=true",
  "stage3IPrepaidRegistrationConversionPlanRequired=true",
  "stage3IProtectedFundsSegregationRecommendedEvenIfExempt=true",
  "stage3IConsumerCashOutKycAssumedRequired=true",
  "stage3IConsumerWithholdingReadyDesignRequired=true",
  "stage3IPaymentStatementPreparationRequired=true",
  "stage3ICommercialAdExplicitConsentRequired=true",
  "stage3IPointTermsRequiredBeforeOpen=true",
  "stage3IBreakageRevenueRecognitionBlockedUntilPolicyApproved=true",
  "stage3IActualRewardOpenAllowed=false",
  "stage3IControlledOpenExecutionAllowed=false",
  "stage3ICashOutActualImplementationAllowed=false",
  "stage3IPartnerSettlementActualImplementationAllowed=false",
  "stage3IDbMigrationAllowed=false",
  "stage3IProductionRewardMutation=false",
  "stage3IProductionPointLedgerMutation=false",
  "stage3IProductionCashRedemptionRequestsMutation=false",
  "stage3IProductionPartnerSettlementsMutation=false",
];

const FULL_ADMIN_MARKERS = [
  ...REQUIRED_MARKERS,
  "stage3IPrepaidQuarterEndOutstandingBalanceMustRemainBelowLimit=true",
  "stage3IPrepaidAnnualTotalIssuedMustRemainBelowLimit=true",
  "stage3IPrepaidIssuanceBlockedWhenHardStopReached=true",
  "stage3IProtectedFundsComminglingRiskAcknowledged=true",
  "stage3IProtectedFundsDailyReconciliationRecommended=true",
  "stage3IBankAccountRawExposureAllowed=false",
  "stage3IPrivacySeparateStorageRequired=true",
  "stage3ICommercialAdWithdrawalRequired=true",
  "stage3IPartnerAgreementRequiredBeforeSettlement=true",
  "stage3IAdvertiserPrepaidTermsRequiredBeforeCharge=true",
  "stage3IProductionCampaignBudgetMutation=false",
  "stage3IProductionUsersBalanceMutation=false",
  "stage3IProductionAdViewsMutation=false",
];

const REQUIRED_VISIBLE_STRINGS = [
  "Threshold-based prepaid registration exemption assumption is locked",
  "Initial operation assumes no prepaid business registration while exemption thresholds remain satisfied",
  "Quarter-end outstanding balance limit is 3,000,000,000 KRW",
  "Annual total issued limit is 50,000,000,000 KRW",
  "Threshold unknown blocks issuance",
  "Threshold exceeded switches to registration track",
  "Actual reward open remains blocked",
  "No production reward mutation",
  "No DB migration in Stage 3-I",
];

const FORBIDDEN_PREVIOUS_ASSUMPTIONS = [
  "stage3IPrepaidBusinessRegistrationAssumedRequired=true",
  "stage3IPrepaidBusinessRegistrationRequiredBeforeActualOpen=true",
  "registration required before actual open",
  "선불업 등록 필요를 기본 가정",
  "등록 면제를 기대하지 않는다",
];

const FORBIDDEN_FINAL_DECISIONS = [
  "prepaidRegistrationExempted=true",
  "registrationExemptionConfirmed=true",
  "noEftaRisk=true",
  "legalReviewCompleted=true",
  "actualOpenAllowed=true",
  "controlledOpenExecutionAllowed=true",
  "cashOutActualImplementationAllowed=true",
  "partnerSettlementActualImplementationAllowed=true",
  "dbMigrationAllowed=true",
  "productionRewardMutation=true",
];

const REQUIRED_DOCUMENT_STRINGS = [
  "초기에는 등록 면제 기준 충족을 전제로 미등록 운영",
  "분기말 발행잔액 30억 원 미만",
  "연간 총발행액 500억 원 미만",
  "두 조건 모두 충족",
  "threshold unknown이면 issuance blocked",
  "threshold exceeded이면 registration track 전환",
  "법률 자문 결과가 아니라 내부 개발상 위험회피 기준",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3I",
  "Threshold-based prepaid registration exemption assumption is locked",
  "Initial operation assumes no prepaid business registration",
  "Threshold unknown blocks issuance",
  "Threshold exceeded switches to registration track",
];

const STAGE3I_POLICY_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3i-threshold-based-prepaid-exemption-assumption.ts"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-i-threshold-based-prepaid-exemption-assumption.md"),
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
    join(WEB_ROOT, "src/lib/compliance/stage3i-threshold-based-prepaid-exemption-assumption.ts"),
  );
  const doc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-i-threshold-based-prepaid-exemption-assumption.md"),
  );
  const compliancePage = readText(
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  );
  const diagnostics = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-I SSOT server-only");
  assertContains(
    ssot,
    "getStage3IThresholdBasedPrepaidExemptionAssumptionState",
    "Stage 3-I SSOT function",
  );

  for (const marker of FULL_ADMIN_MARKERS) {
    const [key, value] = marker.split("=");
    const expected = value === "not_registered" ? `${key}: "${value}"` : `${key}: ${value}`;
    assertContains(ssot, expected, `Stage 3-I SSOT ${key}`);
  }

  for (const marker of REQUIRED_MARKERS) {
    const [key, value] = marker.split("=");
    const expected = value === "not_registered" ? `${key}: "${value}"` : `${key}: ${value}`;
    assertContains(ssot, expected, `Stage 3-I required marker ${key}`);
  }

  for (const required of REQUIRED_DOCUMENT_STRINGS) {
    assertContains(doc, required, "Stage 3-I required conservative phrase");
  }

  assertContains(
    compliancePage,
    "getStage3IThresholdBasedPrepaidExemptionAssumptionState",
    "compliance-preflight Stage 3-I import",
  );
  assertContains(
    diagnostics,
    "getStage3IThresholdBasedPrepaidExemptionAssumptionState",
    "diagnostics Stage 3-I import",
  );
  assertContains(
    productPolicy,
    "Stage 3-I-Threshold-Based-Prepaid-Registration-Exemption-Assumption",
    "product policy Stage 3-I",
  );
  assertContains(
    roadmap,
    "verify:stage3i-threshold-based-prepaid-exemption-assumption",
    "roadmap Stage 3-I verify",
  );
  assertContains(decisionLog, "ADME-DECISION-20260709-014", "decision log Stage 3-I");

  for (const [label, text] of [
    ["Stage 3-I SSOT", ssot],
    ["Stage 3-I doc", doc],
    ["compliance preflight", compliancePage],
    ["diagnostics", diagnostics],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ]) {
    for (const forbidden of [
      ...FORBIDDEN_PREVIOUS_ASSUMPTIONS,
      ...FORBIDDEN_FINAL_DECISIONS,
    ]) {
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

  for (const file of STAGE3I_POLICY_FILES) {
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
    assertNotContains(file, "stage_3_i", "no Stage 3-I DB migration file");
    assertNotContains(file, "prepaid_threshold", "no prepaid threshold DB migration file");
  }

  const statusAdded = gitLines("git status --porcelain -- supabase/migrations");
  const diffAdded = gitLines("git diff --name-only --diff-filter=A HEAD -- supabase/migrations");
  const added = [...statusAdded, ...diffAdded].filter(
    (line) =>
      line.includes("supabase/migrations") &&
      !line.includes("stage_3_p_dev_only_kyc_tax_terms_schema_foundation"),
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
          "stage3IThresholdBasedPrepaidExemptionAssumption",
        );

  assertMarkerList(sources.combined, REQUIRED_VISIBLE_STRINGS, `${path} Stage 3-I visible strings`);
  assertMarkerList(sources.combined, FULL_ADMIN_MARKERS, `${path} Stage 3-I markers`);

  const commit = extractMarkerValue(sources.combined, "stage3IDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3IDeployCommit=${commit}`);
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
  console.log("PASS: verify:stage3i-threshold-based-prepaid-exemption-assumption");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
