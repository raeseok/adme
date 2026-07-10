/**
 * Stage 3-N KYC / Tax / Terms Implementation Approval Gate verification.
 * Read-only approval gate verification only; no migration, provider API, or mutation.
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
  "apps/web/src/lib/compliance/stage3n-kyc-tax-terms-implementation-approval-gate.ts",
  "apps/web/src/app/admin/kyc-tax-terms-implementation-approval/page.tsx",
  "apps/web/src/app/admin/kyc-tax-terms-db-migration-review/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
  "docs/adme/stage-3-n-kyc-tax-terms-implementation-approval-gate.md",
];

const REQUIRED_MARKERS = [
  "stage3NApprovalGateComplete=true",
  "readOnlyApprovalGate=true",
  "migrationImplemented=false",
  "migrationFileCreated=false",
  "supabaseDbPushExecuted=false",
  "actualPersonalDataCollectionImplemented=false",
  "identityProviderIntegrated=false",
  "bankApiIntegrated=false",
  "taxFilingImplemented=false",
  "withholdingCalculationImplemented=false",
  "actualCashOutProcessingAllowed=false",
  "productionMutation=false",
  "legalConclusionDeclared=false",
  "externalLegalTaxReviewStillRequired=true",
  "externalTaxReviewStillRequired=true",
  "externalPrivacyReviewStillRequired=true",
  "externalSecurityReviewStillRequired=true",
  "providerSelectionRequired=true",
  "devMigrationApprovalGranted=false",
  "productionMigrationApprovalGranted=false",
  "personalDataCollectionApprovalGranted=false",
  "providerIntegrationApprovalGranted=false",
  "taxImplementationApprovalGranted=false",
  "cashOutExecutionApprovalGranted=false",
  "overallApprovalStatus=blocked",
  "blockerCount=18",
  "unresolvedCount=3",
  "approvalGateItemCount=19",
  "coreBlockerItemCount=14",
  "stage3NNoApproveButton=true",
  "stage3NNoOverrideButton=true",
  "stage3NNoMutationAction=true",
  "stage3NNoPersonalDataFixture=true",
  "stage3NNoBankAccountFixture=true",
  "stage3NNoProviderRawPayloadFixture=true",
  "stage3NNoTokenSecretFixture=true",
  "stage3NStage3MDesignReviewComplete=true",
  "stage3NStage3MImplementationApprovalGranted=false",
];

const SUMMARY_MARKERS = [
  "stage3NApprovalGateComplete=true",
  "stage3NOverallApprovalStatus=blocked",
  "stage3NDevMigrationApprovalGranted=false",
  "stage3NProductionMigrationApprovalGranted=false",
  "stage3NActualCashOutProcessingAllowed=false",
  "stage3NLegalConclusionDeclared=false",
];

const VISIBLE_STRINGS = [
  "ADME_STAGE_3_N_KYC_TAX_TERMS_IMPLEMENTATION_APPROVAL_GATE",
  "Stage 3-N KYC/Tax/Terms Implementation Approval Gate",
  "Read-only approval gate",
  "Migration implementation: BLOCKED",
  "Production mutation: DISABLED",
  "External legal review required",
  "External tax review required",
  "External privacy review required",
  "Provider selection required",
  "No personal data collection",
  "No bank account storage",
  "No tax filing",
  "No actual cash-out processing",
];

const REQUIRED_DOC_STRINGS = [
  "implementation approval gate",
  "READ-ONLY APPROVAL GATE",
  "NO SQL MIGRATION IMPLEMENTED",
  "NO DB MUTATION",
  "NO PERSONAL DATA COLLECTION",
  "NO PROVIDER INTEGRATION",
  "NO LEGAL CONCLUSION DECLARED",
  "overallApprovalStatus",
  "itemDecision",
  "evidenceStatus",
  "Stage 3-M 설계 완료는 Stage 3-N approval granted를 의미하지 않는다",
  "STAGE3N-001",
  "STAGE3N-014",
  "Production migration은 반드시 별도 단계로 분리한다",
  "Stage 3-O: External Review Question Pack",
  "Stage 3-P: Dev-only Migration Implementation Approval",
];

const TAXONOMY_STRINGS = [
  '"blocked"',
  '"partially_approved"',
  '"approved"',
  '"blocker"',
  '"required_before_dev_migration"',
  '"deferred_until_provider_selection"',
  '"deferred_until_production"',
  '"approved_design_principle"',
  '"rejected"',
  '"not_applicable"',
  '"confirmed"',
  '"operator_attestation_required"',
  '"external_legal_review_required"',
  '"external_tax_review_required"',
  '"external_privacy_review_required"',
  '"external_security_review_required"',
  '"provider_confirmation_required"',
  '"unresolved"',
];

const PUBLIC_ROUTES = [
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3N",
  "Stage 3-N",
  "ADME_STAGE_3_N_KYC_TAX_TERMS_IMPLEMENTATION_APPROVAL_GATE",
  "Implementation Approval Gate",
  "Migration implementation: BLOCKED",
];

const STAGE3N_POLICY_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3n-kyc-tax-terms-implementation-approval-gate.ts"),
  join(WEB_ROOT, "src/app/admin/kyc-tax-terms-implementation-approval/page.tsx"),
  join(WEB_ROOT, "src/app/admin/kyc-tax-terms-db-migration-review/page.tsx"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-n-kyc-tax-terms-implementation-approval-gate.md"),
  join(REPO_ROOT, "docs/adme/product-policy-current.md"),
  join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"),
  join(REPO_ROOT, "docs/adme/adme-decision-log.md"),
];

const dangerousActualCashOutMarker = "actualCashOutProcessingAllowed" + "=true";
const dangerousActualCashOutObject = "actualCashOutProcessingAllowed" + ": true";
const dangerousLegalMarker = "legalConclusionDeclared" + "=true";
const dangerousLegalObject = "legalConclusionDeclared" + ": true";

const DANGEROUS_SOURCE_STRINGS = [
  dangerousActualCashOutMarker,
  dangerousActualCashOutObject,
  dangerousLegalMarker,
  dangerousLegalObject,
  "readOnlyApprovalGate: false",
  "migrationImplemented: true",
  "migrationFileCreated: true",
  "supabaseDbPushExecuted: true",
  "actualPersonalDataCollectionImplemented: true",
  "identityProviderIntegrated: true",
  "bankApiIntegrated: true",
  "taxFilingImplemented: true",
  "withholdingCalculationImplemented: true",
  "productionMutation: true",
  "externalLegalTaxReviewStillRequired: false",
  "externalTaxReviewStillRequired: false",
  "externalPrivacyReviewStillRequired: false",
  "externalSecurityReviewStillRequired: false",
  "providerSelectionRequired: false",
  "devMigrationApprovalGranted: true",
  "productionMigrationApprovalGranted: true",
  "personalDataCollectionApprovalGranted: true",
  "providerIntegrationApprovalGranted: true",
  "taxImplementationApprovalGranted: true",
  "cashOutExecutionApprovalGranted: true",
  'overallApprovalStatus: "approved"',
  'overallApprovalStatus: "partially_approved"',
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
    join(WEB_ROOT, "src/lib/compliance/stage3n-kyc-tax-terms-implementation-approval-gate.ts"),
  );
  const page = readText(
    join(WEB_ROOT, "src/app/admin/kyc-tax-terms-implementation-approval/page.tsx"),
  );
  const stage3MPage = readText(
    join(WEB_ROOT, "src/app/admin/kyc-tax-terms-db-migration-review/page.tsx"),
  );
  const compliancePage = readText(
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  );
  const diagnosticsPage = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const doc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-n-kyc-tax-terms-implementation-approval-gate.md"),
  );
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-N SSOT server-only");
  assertContains(ssot, "STAGE3N_APPROVAL_GATE_ITEMS", "Stage 3-N gate items");
  assertContains(ssot, "STAGE3N_OVERALL_APPROVAL_STATUSES", "Stage 3-N overall taxonomy");
  assertContains(ssot, "STAGE3N_ITEM_DECISIONS", "Stage 3-N item taxonomy");
  assertContains(ssot, "STAGE3N_EVIDENCE_STATUSES", "Stage 3-N evidence taxonomy");
  assertContains(
    ssot,
    "getStage3NKycTaxTermsImplementationApprovalGateState",
    "Stage 3-N state getter",
  );

  for (const required of TAXONOMY_STRINGS) {
    assertContains(ssot, required, "Stage 3-N machine-readable taxonomy");
  }
  for (const marker of REQUIRED_MARKERS) {
    const [key] = marker.split("=");
    assertContains(ssot, key, `Stage 3-N state key ${key}`);
  }
  for (const id of Array.from({ length: 19 }, (_, index) =>
    `STAGE3N-${String(index + 1).padStart(3, "0")}`,
  )) {
    assertContains(ssot, id, `Stage 3-N gate item ${id}`);
  }

  for (const required of VISIBLE_STRINGS) {
    assertContains(page, required, "Stage 3-N page visible string");
  }
  for (const required of REQUIRED_DOC_STRINGS) {
    assertContains(doc, required, "Stage 3-N required document string");
  }
  for (const marker of SUMMARY_MARKERS) {
    assertContains(stage3MPage, marker, "Stage 3-M page Stage 3-N summary");
    assertContains(compliancePage, marker, "compliance-preflight Stage 3-N summary");
    assertContains(diagnosticsPage, marker, "diagnostics Stage 3-N summary");
  }

  for (const forbidden of ["itemDecision: \"normal\"", "itemDecision: \"warning\"", "itemDecision: \"ok\"", "itemDecision: \"caution\"", "evidenceStatus: \"normal\"", "evidenceStatus: \"warning\"", "evidenceStatus: \"ok\"", "evidenceStatus: \"caution\""]) {
    assertNotContains(ssot, forbidden, "Stage 3-N forbidden machine status");
  }
  for (const forbidden of [
    "<form",
    "type=\"submit\"",
    ">Approve<",
    "approveAction",
    "overrideAction",
    "onClick={",
    "action={",
    "formAction",
  ]) {
    assertNotContains(page, forbidden, "Stage 3-N page has no approval/mutation UI");
  }

  assertContains(
    productPolicy,
    "Stage 3-N KYC/Tax/Terms Implementation Approval Gate",
    "product policy Stage 3-N",
  );
  assertContains(
    roadmap,
    "verify:stage3n-kyc-tax-terms-implementation-approval-gate",
    "roadmap Stage 3-N verify",
  );
  assertContains(decisionLog, "ADME-DECISION-20260710-020", "decision log Stage 3-N");

  for (const [label, text] of [
    ["Stage 3-N SSOT", ssot],
    ["Stage 3-N page", page],
    ["Stage 3-M page", stage3MPage],
    ["compliance preflight", compliancePage],
    ["diagnostics", diagnosticsPage],
    ["Stage 3-N doc", doc],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ]) {
    for (const forbidden of DANGEROUS_SOURCE_STRINGS) {
      assertNotContains(text, forbidden, `${label} forbidden expression`);
    }
  }
}

function verifyNoSensitiveFixtures() {
  const files = [
    join(WEB_ROOT, "src/lib/compliance/stage3n-kyc-tax-terms-implementation-approval-gate.ts"),
    join(WEB_ROOT, "src/app/admin/kyc-tax-terms-implementation-approval/page.tsx"),
    join(REPO_ROOT, "docs/adme/stage-3-n-kyc-tax-terms-implementation-approval-gate.md"),
  ];
  const patterns = [
    [/\b\d{6}-\d{7}\b/, "resident registration number fixture"],
    [/\b(?:\d{2,3}-){2,}\d{2,8}\b/, "bank account-like fixture"],
    [/sk_live_[A-Za-z0-9]/, "live secret fixture"],
    [/access_token["'=:\s]+[A-Za-z0-9._-]{12,}/i, "access token fixture"],
    [/refresh_token["'=:\s]+[A-Za-z0-9._-]{12,}/i, "refresh token fixture"],
    [/provider_raw_response["'=:\s]+\{/i, "provider raw response fixture"],
    [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key fixture"],
  ];

  for (const file of files) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    for (const [pattern, label] of patterns) {
      if (pattern.test(text)) {
        throw new Error(`${rel}: forbidden ${label}`);
      }
      console.log(`PASS: ${rel} - no ${label}`);
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

  for (const file of STAGE3N_POLICY_FILES) {
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
    assertNotContains(file, "stage_3_n", "no Stage 3-N DB migration file");
    assertNotContains(file, "stage3n", "no Stage 3-N DB migration file");
    assertNotContains(file, "kyc_tax_terms_implementation", "no KYC tax terms implementation migration file");
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

function verifyNoForbiddenActualCashOutString() {
  const files = [
    ...walkFiles(join(WEB_ROOT, "src")),
    ...walkFiles(join(WEB_ROOT, "scripts")),
    ...walkFiles(join(REPO_ROOT, "docs/adme")),
  ];
  for (const file of files) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    assertNotContains(text, dangerousActualCashOutMarker, `${rel} actual cash-out marker`);
    assertNotContains(text, dangerousActualCashOutObject, `${rel} actual cash-out object`);
  }
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
      : await loadRouteHtml(path, "stage3NApprovalGateComplete");

  const expected =
    path === "/admin/kyc-tax-terms-implementation-approval"
      ? [...VISIBLE_STRINGS, ...REQUIRED_MARKERS]
      : [...SUMMARY_MARKERS, ...REQUIRED_MARKERS];
  assertMarkerList(sources.combined, expected, `${path} Stage 3-N markers`);

  const commit = extractMarkerValue(sources.combined, "stage3NDeployCommit");
  const expectedCommit = expectedDeployCommit();
  if (commit !== expectedCommit) {
    throw new Error(
      `${path} deploy commit mismatch: expected ${expectedCommit}, got ${commit}`,
    );
  }
  console.log(`RESULT: ${path} stage3NDeployCommit=${commit}`);
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

function verifyRegressionCommandsAvailable() {
  const packageJson = readText(join(WEB_ROOT, "package.json"));
  for (const command of [
    "verify:stage3m-kyc-tax-terms-db-migration-design-review",
    "verify:stage3l-kyc-tax-terms-data-model-design",
    "verify:stage3k-protected-fund-reconciliation-design",
    "verify:stage3jr-prepaid-threshold-db-migration-design-review",
    "verify:stage3j-prepaid-threshold-monitoring-architecture",
    "verify:stage3i-threshold-based-prepaid-exemption-assumption",
    "verify:stage3hr-external-review-package",
    "verify:stage3h-compliance-review",
  ]) {
    assertContains(packageJson, `"${command}"`, `regression command available ${command}`);
  }
}

async function main() {
  verifyRequiredFiles();
  verifySourceContract();
  verifyNoSensitiveFixtures();
  verifyNoMutationSource();
  verifyNoMigrationAdded();
  verifyNoForbiddenActualCashOutString();
  verifyPublicSourceGuard();
  verifyRegressionCommandsAvailable();

  for (const path of [
    "/admin/kyc-tax-terms-implementation-approval",
    "/admin/kyc-tax-terms-db-migration-review",
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
  console.log("PASS: verify:stage3n-kyc-tax-terms-implementation-approval-gate");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
