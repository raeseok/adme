/**
 * Stage 3-M KYC / Tax / Terms DB Migration Design Review verification.
 * Design/admin marker verification only; no migration, no provider API, no mutation.
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
  "apps/web/src/lib/compliance/stage3m-kyc-tax-terms-db-migration-design-review.ts",
  "apps/web/src/app/admin/kyc-tax-terms-db-migration-review/page.tsx",
  "apps/web/src/app/admin/kyc-tax-terms-preflight/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
  "docs/adme/stage-3-m-kyc-tax-terms-db-migration-design-review.md",
];

const IDENTITY_STATUSES = [
  "not_started",
  "pending_verification",
  "verified",
  "failed",
  "expired",
  "manual_review_required",
  "revoked",
];

const BANK_STATUSES = [
  "not_registered",
  "pending_verification",
  "verified",
  "failed",
  "expired",
  "manual_review_required",
  "revoked",
];

const TAX_STATUSES = [
  "not_collected",
  "collection_required_before_cash_out",
  "pending_review",
  "ready_for_manual_processing",
  "external_review_required",
  "blocked_missing_required_data",
  "blocked_policy_unresolved",
];

const TERMS_STATUSES = [
  "missing_required_acceptance",
  "accepted_current_versions",
  "accepted_legacy_versions_reacceptance_required",
  "revoked_or_withdrawn",
  "version_unknown_blocked",
];

const MARKETING_STATUSES = [
  "not_asked",
  "opt_in_active",
  "opt_out_active",
  "withdrawn",
  "version_mismatch_reconfirm_required",
];

const GATE_STATUSES = [
  "blocked_reward_open_disabled",
  "blocked_balance_below_minimum",
  "blocked_missing_identity_verification",
  "blocked_missing_bank_account_verification",
  "blocked_missing_required_terms",
  "blocked_terms_reacceptance_required",
  "blocked_tax_profile_incomplete",
  "blocked_tax_external_review_required",
  "blocked_protected_fund_unknown",
  "blocked_protected_fund_deficit",
  "manual_review_required",
  "design_gate_clear_but_actual_cash_out_disabled",
];

const PROTECTED_FUND_STATUSES = [
  "unknown_blocked",
  "deficit_blocked",
  "minimum_covered_warning",
  "covered_below_target_buffer",
  "target_buffer_ok",
  "no_liability_observed",
];

const REQUIRED_ADMIN_MARKERS = [
  "stage3MDesignReviewComplete=true",
  "designReviewOnly=true",
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
  "rawIdentityDataExposed=false",
  "rawBankAccountDataExposed=false",
  "providerRawPayloadStored=false",
  "accessTokenStored=false",
  "refreshTokenStored=false",
  "oauthCodeStored=false",
  "advertiserAccessAllowed=false",
  "partnerAccessAllowed=false",
  "publicMarkerExposed=false",
  "proposedDbObjectsReviewed=true",
  "rlsMatrixReviewed=true",
  "serverOnlyWritePathReviewed=true",
  "auditAppendOnlyReviewed=true",
  "idempotencyReviewed=true",
  "legalDocumentVersioningReviewed=true",
  "marketingConsentHistoryReviewed=true",
  "retentionDeletionPolicyResolved=false",
  "implementationApprovalGranted=false",
  `stage3MIdentityVerificationStatusEnum=${IDENTITY_STATUSES.join(",")}`,
  `stage3MBankAccountVerificationStatusEnum=${BANK_STATUSES.join(",")}`,
  `stage3MTaxProfileStatusEnum=${TAX_STATUSES.join(",")}`,
  `stage3MTermsAcceptanceStatusEnum=${TERMS_STATUSES.join(",")}`,
  `stage3MMarketingConsentStatusEnum=${MARKETING_STATUSES.join(",")}`,
  `stage3MCashOutGateStatusEnum=${GATE_STATUSES.join(",")}`,
];

const SUMMARY_MARKERS = [
  "stage3MDesignReviewComplete=true",
  "stage3MMigrationImplemented=false",
  "stage3MSupabaseDbPushExecuted=false",
  "stage3MActualCashOutProcessingAllowed=false",
  "stage3MLegalConclusionDeclared=false",
];

const REVIEW_PAGE_VISIBLE_STRINGS = [
  "Stage 3-M design review only",
  "NO DB MIGRATION IMPLEMENTED",
  "NO SUPABASE DB PUSH",
  "NO PERSONAL DATA COLLECTION",
  "NO BANK API OR IDENTITY PROVIDER INTEGRATION",
  "NO TAX FILING OR WITHHOLDING IMPLEMENTATION",
  "NO ACTUAL CASH-OUT PROCESSING",
  "LEGAL CONCLUSION NOT DECLARED",
];

const REQUIRED_DOC_STRINGS = [
  "DESIGN REVIEW ONLY",
  "NO DB MIGRATION IMPLEMENTED",
  "NO SUPABASE DB PUSH",
  "NO PERSONAL DATA COLLECTION",
  "NO BANK API OR IDENTITY PROVIDER INTEGRATION",
  "NO TAX FILING OR WITHHOLDING IMPLEMENTATION",
  "NO ACTUAL CASH-OUT PROCESSING",
  "LEGAL CONCLUSION NOT DECLARED",
  "## 1. 목적",
  "## 2. 범위",
  "## 3. 비범위",
  "## 4. 선행 Stage 3-L 설계 요약",
  "## 5. proposed DB object inventory",
  "## 6. 개인정보 및 민감정보 경계",
  "## 7. status 저장 방식 비교",
  "## 8. 약관 버전 및 acceptance 이력",
  "## 9. 마케팅 동의·철회 이력",
  "## 10. identity verification 구조",
  "## 11. bank verification 구조",
  "## 12. tax profile 구조",
  "## 13. cash redemption request 연계",
  "## 14. RLS matrix",
  "## 15. SECURITY DEFINER write path",
  "## 16. audit 및 append-only 원칙",
  "## 17. idempotency 전략",
  "## 18. 보존·삭제·익명화 미확정 사항",
  "## 19. migration dependency/order",
  "## 20. rollback 고려사항",
  "## 21. 외부 법률·세무 검토 필요 사항",
  "## 22. 구현 전 승인 gate",
  "## 23. 명시적 금지 사항",
  "## 24. 완료 판정 기준",
];

const REQUIRED_DESIGN_STRINGS = [
  "consumer_identity_verifications",
  "consumer_bank_account_verifications",
  "consumer_tax_profiles",
  "legal_document_versions",
  "consumer_legal_acceptances",
  "consumer_marketing_consents",
  "cash_redemption_requests",
  "kyc_tax_terms_audit_events",
  "external_provider_reference_boundary",
  "provider token/reference only",
  "encrypted minimal account identifier",
  "separate vault or external provider custody",
  "text + CHECK constraint",
  "lookup table",
  "unknown 상태는 fail-closed",
  "append-only",
  "source_digest",
  "idempotency key",
  "policy_unresolved",
  "external_legal_review_required",
  "implementation_blocked_until_policy_resolved",
  "NON-EXECUTABLE DESIGN EXAMPLE",
];

const STAGE3M_POLICY_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3m-kyc-tax-terms-db-migration-design-review.ts"),
  join(WEB_ROOT, "src/app/admin/kyc-tax-terms-db-migration-review/page.tsx"),
  join(WEB_ROOT, "src/app/admin/kyc-tax-terms-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-m-kyc-tax-terms-db-migration-design-review.md"),
  join(REPO_ROOT, "docs/adme/product-policy-current.md"),
  join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"),
  join(REPO_ROOT, "docs/adme/adme-decision-log.md"),
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3M",
  "Stage 3-M",
  "KYC / Tax / Terms DB Migration Design Review",
  "NO DB MIGRATION IMPLEMENTED",
  "rawIdentityDataExposed",
  "rawBankAccountDataExposed",
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
  "providerRawPayloadStored: true",
  "accessTokenStored: true",
  "refreshTokenStored: true",
  "oauthCodeStored: true",
  "advertiserAccessAllowed: true",
  "partnerAccessAllowed: true",
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
    join(WEB_ROOT, "src/lib/compliance/stage3m-kyc-tax-terms-db-migration-design-review.ts"),
  );
  const reviewPage = readText(
    join(WEB_ROOT, "src/app/admin/kyc-tax-terms-db-migration-review/page.tsx"),
  );
  const kycPreflight = readText(
    join(WEB_ROOT, "src/app/admin/kyc-tax-terms-preflight/page.tsx"),
  );
  const compliancePage = readText(
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  );
  const diagnosticsPage = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const doc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-m-kyc-tax-terms-db-migration-design-review.md"),
  );
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-M SSOT server-only");
  assertContains(ssot, "STAGE3M_METADATA", "Stage 3-M metadata");
  assertContains(
    ssot,
    "STAGE3M_PROPOSED_DB_OBJECT_INVENTORY",
    "Stage 3-M proposed DB object inventory",
  );
  assertContains(ssot, "STAGE3M_RLS_MATRIX", "Stage 3-M RLS matrix");
  assertContains(
    ssot,
    "STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW",
    "Stage 3-M server-only write path review",
  );
  assertContains(
    ssot,
    "STAGE3M_AUDIT_APPEND_ONLY_REVIEW",
    "Stage 3-M append-only audit review",
  );
  assertContains(
    ssot,
    "STAGE3M_LEGAL_DOCUMENT_VERSIONING_REVIEW",
    "Stage 3-M legal document versioning review",
  );
  assertContains(
    ssot,
    "STAGE3M_MARKETING_CONSENT_HISTORY_REVIEW",
    "Stage 3-M marketing consent history review",
  );
  assertContains(
    ssot,
    "STAGE3M_RETENTION_DELETION_REVIEW",
    "Stage 3-M retention/deletion review",
  );
  assertContains(
    ssot,
    "STAGE3M_MIGRATION_DEPENDENCY_ORDER",
    "Stage 3-M migration dependency/order",
  );

  for (const marker of REQUIRED_ADMIN_MARKERS) {
    const [key] = marker.split("=");
    assertContains(ssot, key, `Stage 3-M SSOT marker key ${key}`);
  }

  for (const taxonomyImport of [
    "IDENTITY_VERIFICATION_STATUSES",
    "BANK_ACCOUNT_VERIFICATION_STATUSES",
    "TAX_PROFILE_STATUSES",
    "TERMS_ACCEPTANCE_STATUSES",
    "MARKETING_CONSENT_STATUSES",
    "CASH_OUT_GATE_DESIGN_STATUSES",
  ]) {
    assertContains(
      ssot,
      taxonomyImport,
      `Stage 3-M imports Stage 3-L taxonomy ${taxonomyImport}`,
    );
  }

  for (const required of REQUIRED_DOC_STRINGS) {
    assertContains(doc, required, "Stage 3-M required document section/string");
  }
  for (const required of REQUIRED_DESIGN_STRINGS) {
    assertContains(doc, required, "Stage 3-M required design string");
  }

  for (const required of REVIEW_PAGE_VISIBLE_STRINGS) {
    assertContains(reviewPage, required, "Stage 3-M review page visible string");
  }
  for (const marker of SUMMARY_MARKERS) {
    assertContains(kycPreflight, marker, "KYC preflight Stage 3-M marker");
    assertContains(compliancePage, marker, "compliance-preflight Stage 3-M marker");
    assertContains(diagnosticsPage, marker, "diagnostics Stage 3-M marker");
  }

  assertContains(
    productPolicy,
    "Stage 3-M KYC/Tax/Terms DB Migration Design Review",
    "product policy Stage 3-M",
  );
  assertContains(
    productPolicy,
    "Stage 3-M 완료가 Stage 3-M-Implementation 또는 실제 DB migration을 자동 확정하지 않는다",
    "product policy no automatic implementation",
  );
  assertContains(
    roadmap,
    "verify:stage3m-kyc-tax-terms-db-migration-design-review",
    "roadmap Stage 3-M verify",
  );
  assertContains(decisionLog, "ADME-DECISION-20260710-019", "decision log Stage 3-M");

  for (const [label, text] of [
    ["Stage 3-M SSOT", ssot],
    ["Stage 3-M review page", reviewPage],
    ["KYC preflight", kycPreflight],
    ["compliance preflight", compliancePage],
    ["diagnostics", diagnosticsPage],
    ["Stage 3-M doc", doc],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ]) {
    for (const forbidden of DANGEROUS_SOURCE_STRINGS) {
      assertNotContains(text, forbidden, `${label} forbidden expression`);
    }
  }
}

function verifyStage3LTaxonomyPreserved() {
  const stage3L = readText(
    join(WEB_ROOT, "src/lib/compliance/stage3l-kyc-tax-terms-design.ts"),
  );
  for (const status of [
    ...IDENTITY_STATUSES,
    ...BANK_STATUSES,
    ...TAX_STATUSES,
    ...TERMS_STATUSES,
    ...MARKETING_STATUSES,
    ...GATE_STATUSES,
  ]) {
    assertContains(stage3L, `"${status}"`, `Stage 3-L taxonomy preserved ${status}`);
  }
}

function verifyProtectedFundTaxonomyPreserved() {
  const evaluator = readText(
    join(WEB_ROOT, "src/lib/compliance/protected-fund-reconciliation-evaluator.ts"),
  );
  const design = readText(
    join(WEB_ROOT, "src/lib/compliance/stage3k-protected-fund-reconciliation-design.ts"),
  );
  for (const status of PROTECTED_FUND_STATUSES) {
    assertContains(evaluator, status, `protected fund evaluator taxonomy ${status}`);
    assertContains(design, status, `protected fund design taxonomy ${status}`);
  }
  for (const forbidden of [
    '| "normal"',
    '| "warning"',
    'status: "normal"',
    'status: "warning"',
  ]) {
    assertNotContains(evaluator, forbidden, "protected fund legacy status guard");
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

  for (const file of STAGE3M_POLICY_FILES) {
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
    assertNotContains(file, "stage_3_m", "no Stage 3-M DB migration file");
    assertNotContains(file, "stage3m", "no Stage 3-M DB migration file");
    assertNotContains(file, "kyc_tax_terms_db", "no KYC tax terms DB migration file");
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
      : await loadRouteHtml(path, "stage3MDesignReviewComplete");

  const expected =
    path === "/admin/kyc-tax-terms-db-migration-review"
      ? [...REVIEW_PAGE_VISIBLE_STRINGS, ...REQUIRED_ADMIN_MARKERS]
      : [...SUMMARY_MARKERS, ...REQUIRED_ADMIN_MARKERS];
  assertMarkerList(sources.combined, expected, `${path} Stage 3-M markers`);

  const commit = extractMarkerValue(sources.combined, "stage3MDeployCommit");
  const expectedCommit = expectedDeployCommit();
  if (commit !== expectedCommit) {
    throw new Error(
      `${path} deploy commit mismatch: expected ${expectedCommit}, got ${commit}`,
    );
  }
  console.log(`RESULT: ${path} stage3MDeployCommit=${commit}`);
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
  verifyStage3LTaxonomyPreserved();
  verifyProtectedFundTaxonomyPreserved();
  verifyNoMutationSource();
  verifyNoMigrationAdded();
  verifyNoForbiddenActualCashOutString();
  verifyPublicSourceGuard();

  for (const path of [
    "/admin/kyc-tax-terms-db-migration-review",
    "/admin/kyc-tax-terms-preflight",
    "/admin/compliance-preflight",
    "/admin/diagnostics",
  ]) {
    await verifyAdminPath(path);
  }

  await verifyPublicRoutes();

  for (const marker of REQUIRED_ADMIN_MARKERS) {
    console.log(`RESULT: ${marker}`);
  }
  console.log("RESULT: publicMarkerExposed=false");
  console.log("RESULT: dbMigration=false");
  console.log("RESULT: supabaseDbPush=false");
  console.log("RESULT: productionMutation=false");
  console.log("PASS: verify:stage3m-kyc-tax-terms-db-migration-design-review");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
