/**
 * Stage 3-H-R External Legal / Tax Review Package verification.
 * Read-only package, admin marker, public guard, no mutation, no migration.
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
  "docs/adme/stage-3-h-r-external-review-package.md",
  "docs/adme/external-review/legal-counsel-questionnaire.md",
  "docs/adme/external-review/tax-accountant-questionnaire.md",
  "docs/adme/external-review/external-counsel-attestation-template.md",
  "apps/web/src/lib/compliance/stage3hr-external-review-package.ts",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

const REQUIRED_MARKERS = [
  "stage3HRExternalReviewPackagePrepared=true",
  "stage3HRLegalCounselQuestionnairePrepared=true",
  "stage3HRTaxAccountantQuestionnairePrepared=true",
  "stage3HRAttestationTemplatePrepared=true",
  "stage3HRExternalReviewCompleted=false",
  "stage3HRLegalApprovalRecorded=false",
  "stage3HRTaxApprovalRecorded=false",
  "stage3HRActualOpenAllowed=false",
  "stage3HRDbMigrationAllowed=false",
  "stage3HRProductionRewardMutation=false",
  "stage3HRProductionPointLedgerMutation=false",
  "stage3HRProductionCashRedemptionRequestsMutation=false",
  "stage3HRProductionPartnerSettlementsMutation=false",
];

const REQUIRED_VISIBLE_STRINGS = [
  "External legal and tax review package is prepared",
  "External review is not completed",
  "Actual reward open remains blocked",
];

const FORBIDDEN_DECISION_STRINGS = [
  "legallyApproved=true",
  "taxApproved=true",
  "noLegalRisk=true",
  "noTaxRisk=true",
  "registrationNotRequired=true",
  "taxWithholdingNotRequired=true",
  "actualOpenAllowed=true",
  "externalReviewCompleted=true",
];

const PACKAGE_KEYWORDS = [
  "AdMe Stage 3-H-R External Legal / Tax Review Package",
  "외부 검토 대상 요약",
  "AdMe 사업구조 요약",
  "현재 시스템 block 상태 요약",
  "법무법인 검토 요청서",
  "세무사 검토 요청서",
  "약관/개인정보 문서 검토 요청서",
  "파트너 계약 검토 요청서",
  "외부 검토 결과 수령 후 반영 방식",
  "Stage 3-H-R에서 하지 않는 것",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
];

const PUBLIC_FORBIDDEN_STRINGS = [
  "stage3HR",
  "External legal and tax review package is prepared",
  "External review is not completed",
  "Actual reward open remains blocked",
];

const STAGE3HR_SOURCE_FILES = [
  join(WEB_ROOT, "src/lib/compliance/stage3hr-external-review-package.ts"),
  join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
  join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  join(REPO_ROOT, "docs/adme/stage-3-h-r-external-review-package.md"),
  join(REPO_ROOT, "docs/adme/external-review/legal-counsel-questionnaire.md"),
  join(REPO_ROOT, "docs/adme/external-review/tax-accountant-questionnaire.md"),
  join(REPO_ROOT, "docs/adme/external-review/external-counsel-attestation-template.md"),
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
  const ssot = readText(join(WEB_ROOT, "src/lib/compliance/stage3hr-external-review-package.ts"));
  const packageDoc = readText(join(REPO_ROOT, "docs/adme/stage-3-h-r-external-review-package.md"));
  const legalQuestionnaire = readText(join(REPO_ROOT, "docs/adme/external-review/legal-counsel-questionnaire.md"));
  const taxQuestionnaire = readText(join(REPO_ROOT, "docs/adme/external-review/tax-accountant-questionnaire.md"));
  const attestationTemplate = readText(join(REPO_ROOT, "docs/adme/external-review/external-counsel-attestation-template.md"));
  const compliancePage = readText(join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"));
  const diagnostics = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(ssot, 'import "server-only"', "Stage 3-H-R SSOT server-only");
  assertContains(
    ssot,
    "getStage3HRExternalReviewPackageState",
    "Stage 3-H-R SSOT function",
  );

  for (const marker of REQUIRED_MARKERS) {
    const [key, value] = marker.split("=");
    const expected = `${key}: ${value}`;
    assertContains(ssot, expected, `Stage 3-H-R SSOT ${key}`);
  }

  for (const keyword of PACKAGE_KEYWORDS) {
    assertContains(packageDoc, keyword, "Stage 3-H-R package document keyword");
  }

  assertContains(legalQuestionnaire, "전자금융거래법 / 선불전자지급수단", "legal questionnaire EFTA");
  assertContains(legalQuestionnaire, "개인정보 보호", "legal questionnaire privacy");
  assertContains(legalQuestionnaire, "정보통신망법 광고성 정보", "legal questionnaire ad consent");
  assertContains(legalQuestionnaire, "파트너 계약", "legal questionnaire partner contract");
  assertContains(taxQuestionnaire, "소비자 현금 전환액의 소득 성격", "tax questionnaire consumer income");
  assertContains(taxQuestionnaire, "원천징수", "tax questionnaire withholding");
  assertContains(taxQuestionnaire, "파트너 정산", "tax questionnaire partner settlement");
  assertContains(taxQuestionnaire, "광고주 선납금", "tax questionnaire advertiser prepaid");
  assertContains(taxQuestionnaire, "브레이키지", "tax questionnaire breakage");
  assertContains(attestationTemplate, "prepaid instrument applicability: undetermined", "attestation prepaid pending");
  assertContains(attestationTemplate, "withholding required: undetermined", "attestation withholding pending");
  assertContains(attestationTemplate, "actual open allowed: false", "attestation actual open blocked");
  assertContains(
    compliancePage,
    "getStage3HRExternalReviewPackageState",
    "compliance-preflight Stage 3-H-R import",
  );
  assertContains(
    diagnostics,
    "getStage3HRExternalReviewPackageState",
    "diagnostics Stage 3-H-R import",
  );
  assertContains(productPolicy, "Stage 3-H-R-External-Review-Package", "product policy Stage 3-H-R");
  assertContains(roadmap, "verify:stage3hr-external-review-package", "roadmap Stage 3-H-R verify");
  assertContains(decisionLog, "ADME-DECISION-20260709-013", "decision log Stage 3-H-R decision");

  for (const file of STAGE3HR_SOURCE_FILES) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    for (const forbidden of FORBIDDEN_DECISION_STRINGS) {
      assertNotContains(text, forbidden, `${rel} forbidden final decision`);
    }
  }
}

function verifyNoMutationSource() {
  const codeFiles = [
    join(WEB_ROOT, "src/lib/compliance/stage3hr-external-review-package.ts"),
    join(WEB_ROOT, "src/app/admin/compliance-preflight/page.tsx"),
    join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  ];
  const mutationPatterns = [
    [/\.from\(\s*["'`]point_ledger["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "point_ledger mutation"],
    [/\.from\(\s*["'`]cash_redemption_requests["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "cash_redemption_requests mutation"],
    [/\.from\(\s*["'`]partner_settlements["'`]\s*\)\s*\.\s*(insert|update|delete|upsert)\s*\(/i, "partner_settlements mutation"],
    [/campaigns?[\s\S]{0,80}\.update\(/i, "campaign budget update"],
    [/users[\s\S]{0,80}\.update\([\s\S]{0,120}balance/i, "users balance update"],
    [/ad_views[\s\S]{0,120}\.(insert|update|delete|upsert)\(/i, "ad_views mutation"],
    [/\.rpc\(\s*["'`][^"'`]*(reward|cash|redemption|settlement|payout|chargeback)[^"'`]*["'`]/i, "actual mutation RPC"],
  ];

  for (const file of codeFiles) {
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
    assertNotContains(file, "stage_3_h_r", "no Stage 3-H-R DB migration file");
    assertNotContains(file, "external_review", "no external review DB migration file");
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
      : await loadRouteHtml(path, "stage3HRExternalReviewPackagePrepared");

  assertMarkerList(sources.combined, REQUIRED_MARKERS, `${path} Stage 3-H-R markers`);
  assertMarkerList(sources.combined, REQUIRED_VISIBLE_STRINGS, `${path} Stage 3-H-R visible strings`);

  const commit = extractMarkerValue(sources.combined, "stage3HRDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3HRDeployCommit=${commit}`);
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
  console.log("PASS: verify:stage3hr-external-review-package");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
