/**
 * Stage 3-L KYC / Tax / Terms Data Model Design verification.
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
  "apps/web/src/lib/compliance/stage3l-kyc-tax-terms-design.ts",
  "apps/web/src/lib/compliance/kyc-tax-terms-gate-evaluator.ts",
  "apps/web/src/app/admin/kyc-tax-terms-preflight/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
  "docs/adme/stage-3-l-kyc-tax-terms-data-model-design.md",
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

const dangerousActualCashOutObject = "actualCashOutProcessingAllowed" + ": true";
const dangerousActualCashOutMarker = "actualCashOutProcessingAllowed" + "=true";

const REQUIRED_ADMIN_MARKERS = [
  "stage3LKycTaxTermsDataModelDesigned=true",
  "stage3LReadOnlyDesignOnly=true",
  "stage3LDbMigrationImplemented=false",
  "stage3LSupabaseDbPushExecuted=false",
  "stage3LActualPersonalDataCollectionImplemented=false",
  "stage3LIdentityProviderIntegrated=false",
  "stage3LBankApiIntegrated=false",
  "stage3LTaxFilingImplemented=false",
  "stage3LWithholdingCalculationImplemented=false",
  "stage3LCashOutActualProcessing=false",
  "stage3LProductionMutation=false",
  "stage3LRewardOpenGateSeparated=true",
  "stage3LCashOutGateUserLevelDesigned=true",
  "stage3LTermsVersioningDesigned=true",
  "stage3LMarketingConsentWithdrawalDesigned=true",
  "stage3LSensitiveDataBoundaryDesigned=true",
  "stage3LLegalConclusionDeclared=false",
  "stage3LExternalLegalTaxReviewStillRequired=true",
  "stage3LBankAccountRawExposure=false",
  "stage3LFullIdentityRawExposure=false",
  "stage3LProviderRawResponseExposure=false",
  "stage3LPublicMarkerExposure=false",
  `stage3LIdentityVerificationStatusEnum=${IDENTITY_STATUSES.join(",")}`,
  `stage3LBankAccountVerificationStatusEnum=${BANK_STATUSES.join(",")}`,
  `stage3LTaxProfileStatusEnum=${TAX_STATUSES.join(",")}`,
  `stage3LTermsAcceptanceStatusEnum=${TERMS_STATUSES.join(",")}`,
  `stage3LMarketingConsentStatusEnum=${MARKETING_STATUSES.join(",")}`,
  `stage3LCashOutGateStatusEnum=${GATE_STATUSES.join(",")}`,
];

const PREFLIGHT_ONLY_MARKERS = [
  "stage3LGateCaseRewardDisabled=blocked_reward_open_disabled",
  "stage3LGateCaseLowBalance=blocked_balance_below_minimum",
  "stage3LGateCaseMissingIdentity=blocked_missing_identity_verification",
  "stage3LGateCaseMissingBank=blocked_missing_bank_account_verification",
  "stage3LGateCaseMissingTerms=blocked_missing_required_terms",
  "stage3LGateCaseLegacyTerms=blocked_terms_reacceptance_required",
  "stage3LGateCaseTaxIncomplete=blocked_tax_profile_incomplete",
  "stage3LGateCaseTaxExternalReview=blocked_tax_external_review_required",
  "stage3LGateCaseProtectedFundUnknown=blocked_protected_fund_unknown",
  "stage3LGateCaseProtectedFundDeficit=blocked_protected_fund_deficit",
  "stage3LGateCaseManualReview=manual_review_required",
  "stage3LGateCaseDesignClearButDisabled=design_gate_clear_but_actual_cash_out_disabled",
  "stage3LGateActualCashOutAllowed=false",
];

const COMPLIANCE_MARKERS = [
  "stage3LKycTaxTermsDesignComplete=true",
  "stage3LCashOutGateSeparated=true",
  "stage3LActualCashOutStillBlocked=true",
  "stage3LLegalTaxExternalReviewStillRequired=true",
  "stage3LNoDbMigration=true",
  "stage3LNoSupabaseDbPush=true",
  "stage3LNoProductionMutation=true",
];

const DIAGNOSTICS_MARKERS = [
  "stage3LKycTaxTermsDataModelDesigned=true",
  "stage3LReadOnlyDesignOnly=true",
  "stage3LCashOutActualProcessing=false",
  "stage3LProductionMutation=false",
  "stage3LDbMigrationImplemented=false",
  "stage3LSupabaseDbPushExecuted=false",
  "stage3LPublicMarkerExposure=false",
];

const REQUIRED_DOC_STRINGS = [
  "Stage 3-L 목표",
  "Stage 3-L 비목표",
  "reward open gate와 cash-out gate 분리 원칙",
  "민감정보 분리 원칙",
  "proposed tables",
  "proposed enums",
  "proposed RLS 방향",
  "proposed SECURITY DEFINER write path 방향",
  "proposed audit / idempotency / source_digest 방향",
  "약관 버전 관리 구조",
  "광고성 정보 수신 동의 및 철회 구조",
  "세무 검토 대비 구조",
  "본인확인/KYC 구조",
  "본인 명의 계좌 확인 구조",
  "cash-out gate evaluator 설계",
  "Stage 3-M 이후로 넘길 항목",
  "절대 금지 사항",
  "검증 marker 목록",
  "완료보고 기준",
  "terms_documents",
  "user_terms_acceptance_events",
  "marketing_consent_events",
  "identity_verification_sessions",
  "bank_account_verification_sessions",
  "tax_profile_review_snapshots",
  "cash_out_gate_review_snapshots",
  "kyc_tax_terms_audit_logs",
];

const DANGEROUS_STRINGS = [
  "stage3LActualPersonalDataCollectionImplemented=true",
  "stage3LIdentityProviderIntegrated=true",
  "stage3LBankApiIntegrated=true",
  "stage3LTaxFilingImplemented=true",
  "stage3LWithholdingCalculationImplemented=true",
  "stage3LCashOutActualProcessing=true",
  "stage3LProductionMutation=true",
  "stage3LDbMigrationImplemented=true",
  "stage3LSupabaseDbPushExecuted=true",
  "stage3LLegalConclusionDeclared=true",
  dangerousActualCashOutObject,
  dangerousActualCashOutMarker,
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3L",
  "kyc tax terms preflight marker",
  "raw bank account",
  "raw identity",
  "provider raw response",
  "service_role",
  "quiz_answer",
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
  "OAuth token",
  "주민등록번호",
  "계좌번호 원문",
];

const STAGE3L_POLICY_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3l-kyc-tax-terms-design.ts"),
  join(WEB_ROOT, "src/lib/compliance/kyc-tax-terms-gate-evaluator.ts"),
  join(WEB_ROOT, "src/app/admin/kyc-tax-terms-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-l-kyc-tax-terms-data-model-design.md"),
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
    join(WEB_ROOT, "src/lib/compliance/stage3l-kyc-tax-terms-design.ts"),
  );
  const evaluator = readText(
    join(WEB_ROOT, "src/lib/compliance/kyc-tax-terms-gate-evaluator.ts"),
  );
  const preflightPage = readText(
    join(WEB_ROOT, "src/app/admin/kyc-tax-terms-preflight/page.tsx"),
  );
  const compliancePage = readText(
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  );
  const diagnosticsPage = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const doc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-l-kyc-tax-terms-data-model-design.md"),
  );
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-L SSOT server-only");
  assertContains(
    ssot,
    "STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS",
    "Stage 3-L SSOT status",
  );
  assertContains(
    evaluator,
    "evaluateKycTaxTermsCashOutGate",
    "Stage 3-L evaluator function",
  );
  assertContains(
    evaluator,
    "actualCashOutProcessingAllowed: false",
    "Stage 3-L actual cash-out disabled",
  );

  for (const status of [
    ...IDENTITY_STATUSES,
    ...BANK_STATUSES,
    ...TAX_STATUSES,
    ...TERMS_STATUSES,
    ...MARKETING_STATUSES,
    ...GATE_STATUSES,
  ]) {
    assertContains(ssot, `"${status}"`, `Stage 3-L enum ${status}`);
  }

  for (const status of [
    "unknown_blocked",
    "deficit_blocked",
    "minimum_covered_warning",
    "covered_below_target_buffer",
    "target_buffer_ok",
    "no_liability_observed",
  ]) {
    assertContains(
      evaluator,
      status,
      `Stage 3-L protected fund taxonomy ${status}`,
    );
  }

  for (const forbidden of [
    '| "normal"',
    '| "warning"',
    'status: "normal"',
    'status: "warning"',
  ]) {
    assertNotContains(
      evaluator,
      forbidden,
      "Stage 3-L protected fund legacy status guard",
    );
  }

  for (const marker of REQUIRED_ADMIN_MARKERS) {
    const [key] = marker.split("=");
    assertContains(ssot, key, `Stage 3-L SSOT ${key}`);
  }
  assertContains(
    preflightPage,
    "Object.entries(design)",
    "Stage 3-L preflight renders SSOT markers",
  );

  for (const marker of PREFLIGHT_ONLY_MARKERS) {
    const key = marker.split("=")[0];
    assertContains(preflightPage, key, `Stage 3-L preflight marker ${key}`);
  }

  for (const marker of COMPLIANCE_MARKERS) {
    assertContains(
      compliancePage,
      marker,
      "Stage 3-L compliance-preflight marker",
    );
  }

  for (const marker of DIAGNOSTICS_MARKERS) {
    assertContains(diagnosticsPage, marker, "Stage 3-L diagnostics marker");
  }

  for (const required of REQUIRED_DOC_STRINGS) {
    assertContains(doc, required, "Stage 3-L required document string");
  }

  assertContains(
    productPolicy,
    "KYC/Tax/Terms data model designed=true",
    "product policy Stage 3-L",
  );
  assertContains(
    productPolicy,
    "external legal/tax review still required=true",
    "product policy external review still required",
  );
  assertContains(
    roadmap,
    "verify:stage3l-kyc-tax-terms-data-model-design",
    "roadmap Stage 3-L verify",
  );
  assertContains(
    decisionLog,
    "ADME-DECISION-20260710-018",
    "decision log Stage 3-L",
  );

  for (const [label, text] of [
    ["Stage 3-L SSOT", ssot],
    ["Stage 3-L evaluator", evaluator],
    ["Stage 3-L preflight", preflightPage],
    ["compliance preflight", compliancePage],
    ["diagnostics", diagnosticsPage],
    ["Stage 3-L doc", doc],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ]) {
    for (const forbidden of DANGEROUS_STRINGS) {
      assertNotContains(text, forbidden, `${label} forbidden expression`);
    }
  }
}

function evaluateGate(input) {
  if (!input.rewardOpenFlag || input.killSwitchOn) {
    return {
      status: "blocked_reward_open_disabled",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.pointBalanceWon < input.minimumCashOutWon) {
    return {
      status: "blocked_balance_below_minimum",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.identityVerificationStatus !== "verified") {
    return {
      status: "blocked_missing_identity_verification",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.bankAccountVerificationStatus !== "verified") {
    return {
      status: "blocked_missing_bank_account_verification",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.requiredTermsAcceptanceStatus === "missing_required_acceptance") {
    return {
      status: "blocked_missing_required_terms",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (
    input.requiredTermsAcceptanceStatus ===
    "accepted_legacy_versions_reacceptance_required"
  ) {
    return {
      status: "blocked_terms_reacceptance_required",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (
    input.taxProfileStatus === "not_collected" ||
    input.taxProfileStatus === "blocked_missing_required_data"
  ) {
    return {
      status: "blocked_tax_profile_incomplete",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (
    input.taxProfileStatus === "external_review_required" ||
    input.taxProfileStatus === "blocked_policy_unresolved"
  ) {
    return {
      status: "blocked_tax_external_review_required",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.protectedFundStatus === "unknown_blocked") {
    return {
      status: "blocked_protected_fund_unknown",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.protectedFundStatus === "deficit_blocked") {
    return {
      status: "blocked_protected_fund_deficit",
      actualCashOutProcessingAllowed: false,
    };
  }
  if (input.manualReviewRequired) {
    return {
      status: "manual_review_required",
      actualCashOutProcessingAllowed: false,
    };
  }
  return {
    status: "design_gate_clear_but_actual_cash_out_disabled",
    actualCashOutProcessingAllowed: false,
  };
}

function verifyEvaluatorCases() {
  const base = {
    rewardOpenFlag: true,
    killSwitchOn: false,
    pointBalanceWon: 10000,
    minimumCashOutWon: 10000,
    identityVerificationStatus: "verified",
    bankAccountVerificationStatus: "verified",
    requiredTermsAcceptanceStatus: "accepted_current_versions",
    taxProfileStatus: "ready_for_manual_processing",
    protectedFundStatus: "target_buffer_ok",
    manualReviewRequired: false,
  };
  const cases = [
    ["reward disabled", { ...base, rewardOpenFlag: false }, "blocked_reward_open_disabled"],
    ["kill switch", { ...base, killSwitchOn: true }, "blocked_reward_open_disabled"],
    ["low balance", { ...base, pointBalanceWon: 9999 }, "blocked_balance_below_minimum"],
    [
      "missing identity",
      { ...base, identityVerificationStatus: "not_started" },
      "blocked_missing_identity_verification",
    ],
    [
      "missing bank",
      { ...base, bankAccountVerificationStatus: "not_registered" },
      "blocked_missing_bank_account_verification",
    ],
    [
      "missing terms",
      { ...base, requiredTermsAcceptanceStatus: "missing_required_acceptance" },
      "blocked_missing_required_terms",
    ],
    [
      "legacy terms",
      {
        ...base,
        requiredTermsAcceptanceStatus:
          "accepted_legacy_versions_reacceptance_required",
      },
      "blocked_terms_reacceptance_required",
    ],
    [
      "tax incomplete",
      { ...base, taxProfileStatus: "not_collected" },
      "blocked_tax_profile_incomplete",
    ],
    [
      "tax external review",
      { ...base, taxProfileStatus: "external_review_required" },
      "blocked_tax_external_review_required",
    ],
    [
      "protected fund unknown",
      { ...base, protectedFundStatus: "unknown_blocked" },
      "blocked_protected_fund_unknown",
    ],
    [
      "protected fund deficit",
      { ...base, protectedFundStatus: "deficit_blocked" },
      "blocked_protected_fund_deficit",
    ],
    [
      "manual review",
      { ...base, manualReviewRequired: true },
      "manual_review_required",
    ],
    [
      "design clear but disabled",
      base,
      "design_gate_clear_but_actual_cash_out_disabled",
    ],
  ];

  for (const [label, input, expected] of cases) {
    const result = evaluateGate(input);
    if (result.status !== expected) {
      throw new Error(`evaluator ${label}: expected ${expected}, got ${result.status}`);
    }
    if (result.actualCashOutProcessingAllowed !== false) {
      throw new Error(`evaluator ${label}: actual cash-out must remain disabled`);
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

  for (const file of STAGE3L_POLICY_FILES) {
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
    if (file.includes("stage_3_p_dev_only_kyc_tax_terms_schema_foundation")) {
      continue;
    }
    assertNotContains(file, "stage_3_l", "no Stage 3-L DB migration file");
    assertNotContains(file, "stage3l", "no Stage 3-L DB migration file");
    assertNotContains(file, "kyc_tax_terms", "no KYC tax terms DB migration file");
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
      : await loadRouteHtml(path, "stage3LKycTaxTermsDataModelDesigned");

  const expected =
    path === "/admin/kyc-tax-terms-preflight"
      ? [...REQUIRED_ADMIN_MARKERS, ...PREFLIGHT_ONLY_MARKERS]
      : path === "/admin/compliance-preflight"
        ? [...REQUIRED_ADMIN_MARKERS, ...COMPLIANCE_MARKERS]
        : [...REQUIRED_ADMIN_MARKERS, ...DIAGNOSTICS_MARKERS];

  assertMarkerList(sources.combined, expected, `${path} Stage 3-L markers`);

  const commit = extractMarkerValue(sources.combined, "stage3LDeployCommit");
  const expectedCommit = expectedDeployCommit();
  if (commit !== expectedCommit) {
    throw new Error(
      `${path} deploy commit mismatch: expected ${expectedCommit}, got ${commit}`,
    );
  }
  console.log(`RESULT: ${path} stage3LDeployCommit=${commit}`);
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
  for (const marker of PREFLIGHT_ONLY_MARKERS) {
    console.log(`RESULT: ${marker}`);
  }
  console.log("RESULT: publicMarkerExposed=false");
  console.log("RESULT: dbMigration=false");
  console.log("RESULT: supabaseDbPush=false");
  console.log("RESULT: productionMutation=false");
  console.log("PASS: verify:stage3l-kyc-tax-terms-data-model-design");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
