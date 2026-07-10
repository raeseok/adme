/**
 * Stage 3-H Legal / Tax / Payment Compliance Review verification.
 * Read-only Production marker/public guard verification only.
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
import { assertContains, assertNotContains, readText, walkFiles } from "./utils/stage3e-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const BASE = resolveProductionE2eBaseUrl();

const REQUIRED_FILES = [
  "apps/web/src/lib/compliance/stage3h-legal-tax-payment-compliance.ts",
  "docs/adme/stage-3-h-legal-tax-payment-compliance-review.md",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
];

const DOCUMENT_KEYWORDS = [
  "Legal / Tax / Payment Compliance Review",
  "external legal and tax review",
  "electronic financial transaction",
  "prepaid",
  "withholding",
  "privacy policy",
  "commercial ad consent",
  "point terms",
  "partner agreement",
  "actual reward open is blocked",
  "no DB migration",
];

const FORBIDDEN_DECISION_STRINGS = [
  "registrationNotRequired=true",
  "taxWithholdingNotRequired=true",
  "legallyApproved=true",
  "noLegalRisk=true",
  "noTaxRisk=true",
  "openAllowed=true",
];

const REQUIRED_MARKERS = [
  "stage3HLegalTaxPaymentComplianceReview=true",
  "stage3HExternalLegalTaxReviewRequired=true",
  "stage3HActualRewardOpenAllowed=false",
  "stage3HControlledOpenExecutionAllowed=false",
  "stage3HCashOutActualImplementationAllowed=false",
  "stage3HPartnerSettlementActualImplementationAllowed=false",
  "stage3HDbMigrationAllowed=false",
  "stage3HProductionRewardMutation=false",
  "stage3HProductionPointLedgerMutation=false",
  "stage3HProductionCashRedemptionRequestsMutation=false",
  "stage3HProductionPartnerSettlementsMutation=false",
];

const FULL_ADMIN_MARKERS = [
  "stage3HLegalTaxPaymentComplianceReview=true",
  "stage3HExternalLegalTaxReviewRequired=true",
  "stage3HElectronicFinancialTransactionActReviewRequired=true",
  "stage3HPrepaidPaymentInstrumentRiskStatus=requires_counsel",
  "stage3HPrepaidRegistrationDecisionStatus=undetermined",
  "stage3HConsumerRewardTaxReviewRequired=true",
  "stage3HConsumerWithholdingDecisionStatus=undetermined",
  "stage3HPartnerSettlementTaxReviewRequired=true",
  "stage3HPrivacyPolicyReviewRequired=true",
  "stage3HCommercialAdConsentReviewRequired=true",
  "stage3HPointTermsReviewRequired=true",
  "stage3HPartnerAgreementReviewRequired=true",
  "stage3HActualRewardOpenAllowed=false",
  "stage3HControlledOpenExecutionAllowed=false",
  "stage3HCashOutActualImplementationAllowed=false",
  "stage3HPartnerSettlementActualImplementationAllowed=false",
  "stage3HDbMigrationAllowed=false",
  "stage3HProductionRewardMutation=false",
  "stage3HProductionPointLedgerMutation=false",
  "stage3HProductionCampaignBudgetMutation=false",
  "stage3HProductionUsersBalanceMutation=false",
  "stage3HProductionAdViewsMutation=false",
  "stage3HProductionCashRedemptionRequestsMutation=false",
  "stage3HProductionPartnerSettlementsMutation=false",
];

const REQUIRED_VISIBLE_STRINGS = [
  "Legal / Tax / Payment Compliance Review",
  "Actual reward open is blocked pending external legal and tax review",
  "No production reward mutation",
  "No cash-out actual processing",
  "No partner settlement actual processing",
  "No DB migration in Stage 3-H",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3H",
  "Legal / Tax / Payment Compliance Review",
  "PrepaidPaymentInstrumentRiskStatus",
  "ConsumerWithholdingDecisionStatus",
  "actual reward open is blocked pending external legal and tax review",
];

const STAGE3H_SOURCE_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3h-legal-tax-payment-compliance.ts"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-h-legal-tax-payment-compliance-review.md"),
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
  const ssot = readText(join(WEB_ROOT, "src/lib/compliance/stage3h-legal-tax-payment-compliance.ts"));
  const doc = readText(join(REPO_ROOT, "docs/adme/stage-3-h-legal-tax-payment-compliance-review.md"));
  const compliancePage = readText(join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"));
  const rewardPreflight = readText(join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"));
  const diagnostics = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-H SSOT server-only");
  assertContains(ssot, "requires_counsel", "Stage 3-H counsel status");
  assertContains(ssot, "undetermined", "Stage 3-H undetermined status");

  for (const marker of FULL_ADMIN_MARKERS) {
    const [key, value] = marker.split("=");
    const expected =
      value === "requires_counsel" || value === "undetermined"
        ? `${key}: "${value}"`
        : `${key}: ${value}`;
    assertContains(ssot, expected, `Stage 3-H SSOT ${key}`);
  }

  for (const keyword of DOCUMENT_KEYWORDS) {
    assertContains(doc, keyword, `Stage 3-H document keyword`);
  }

  const policySources = [
    ["Stage 3-H SSOT", ssot],
    ["Stage 3-H doc", doc],
    ["compliance preflight", compliancePage],
    ["reward preflight", rewardPreflight],
    ["diagnostics", diagnostics],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ];
  for (const [label, text] of policySources) {
    for (const forbidden of FORBIDDEN_DECISION_STRINGS) {
      assertNotContains(text, forbidden, `${label} forbidden final decision`);
    }
  }

  assertContains(
    rewardPreflight,
    "getStage3HLegalTaxPaymentComplianceState",
    "reward-preflight Stage 3-H import",
  );
  assertContains(
    diagnostics,
    "getStage3HLegalTaxPaymentComplianceState",
    "diagnostics Stage 3-H import",
  );
  assertContains(
    compliancePage,
    "getStage3HLegalTaxPaymentComplianceState",
    "compliance-preflight Stage 3-H import",
  );
  assertContains(productPolicy, "Stage 3-H-Legal-Tax-Payment-Compliance-Review", "product policy Stage 3-H");
  assertContains(roadmap, "verify:stage3h-compliance-review", "roadmap Stage 3-H verify");
  assertContains(decisionLog, "ADME-DECISION-20260709-012", "decision log Stage 3-H decision");
}

function verifyNoMutationSource() {
  const mutationPatterns = [
    [/\.from\(\s*["'`]point_ledger["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "point_ledger mutation"],
    [/\.from\(\s*["'`]cash_redemption_requests["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "cash_redemption_requests mutation"],
    [/\.from\(\s*["'`]partner_settlements["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "partner_settlements mutation"],
    [/campaigns?[\s\S]{0,80}\.update\(/i, "campaign budget update"],
    [/users[\s\S]{0,80}\.update\([\s\S]{0,120}balance/i, "users balance update"],
    [/ad_views[\s\S]{0,120}\.(insert|update|delete|upsert)\(/i, "ad_views reward mutation"],
    [/\.rpc\(\s*["'`][^"'`]*(reward|cash|redemption|settlement|payout|chargeback)[^"'`]*["'`]/i, "actual mutation RPC"],
  ];

  for (const file of STAGE3H_SOURCE_FILES) {
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
    assertNotContains(file, "stage_3_h", "no Stage 3-H DB migration file");
    assertNotContains(file, "compliance", "no compliance DB migration file");
  }

  const statusAdded = gitLines("git status --porcelain -- supabase/migrations");
  const diffAdded = gitLines("git diff --name-only --diff-filter=A HEAD -- supabase/migrations");
  let headAdded = [];
  try {
    headAdded = gitLines("git show --name-only --format= HEAD -- supabase/migrations");
  } catch {
    headAdded = [];
  }

  const added = [...statusAdded, ...diffAdded, ...headAdded].filter(
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
      : await loadRouteHtml(path, "stage3HLegalTaxPaymentComplianceReview");

  const markers = path === "/admin/compliance-preflight" || path === "/admin/diagnostics"
    ? FULL_ADMIN_MARKERS
    : REQUIRED_MARKERS;
  assertMarkerList(sources.combined, markers, `${path} Stage 3-H markers`);

  if (path === "/admin/compliance-preflight") {
    assertMarkerList(
      sources.combined,
      REQUIRED_VISIBLE_STRINGS,
      `${path} Stage 3-H visible strings`,
    );
  }

  const commit = extractMarkerValue(sources.combined, "stage3HDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3HDeployCommit=${commit}`);
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
          assertNotContains(body, forbidden, `public body ${route} ${viewport.width}x${viewport.height}`);
          assertNotContains(html, forbidden, `public html ${route} ${viewport.width}x${viewport.height}`);
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
    "/admin/reward-preflight",
    "/admin/diagnostics",
  ]) {
    await verifyAdminPath(path);
  }

  await verifyPublicRoutes();

  console.log("RESULT: stage3HLegalTaxPaymentComplianceReview=true");
  console.log("RESULT: stage3HExternalLegalTaxReviewRequired=true");
  console.log("RESULT: stage3HElectronicFinancialTransactionActReviewRequired=true");
  console.log("RESULT: stage3HPrepaidPaymentInstrumentRiskStatus=requires_counsel");
  console.log("RESULT: stage3HPrepaidRegistrationDecisionStatus=undetermined");
  console.log("RESULT: stage3HConsumerRewardTaxReviewRequired=true");
  console.log("RESULT: stage3HConsumerWithholdingDecisionStatus=undetermined");
  console.log("RESULT: stage3HActualRewardOpenAllowed=false");
  console.log("RESULT: stage3HCashOutActualImplementationAllowed=false");
  console.log("RESULT: stage3HPartnerSettlementActualImplementationAllowed=false");
  console.log("RESULT: stage3HDbMigrationAllowed=false");
  console.log("RESULT: stage3HProductionRewardMutation=false");
  console.log("RESULT: stage3HProductionPointLedgerMutation=false");
  console.log("RESULT: stage3HProductionCashRedemptionRequestsMutation=false");
  console.log("RESULT: stage3HProductionPartnerSettlementsMutation=false");
  console.log("RESULT: publicMarkerExposed=false");
  console.log("RESULT: dbMigration=false");
  console.log("PASS: verify:stage3h-compliance-review");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
