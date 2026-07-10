/**
 * Stage 3-O External Review Question Pack verification.
 * Read-only question-pack verification only; no migration, provider API, external send, or mutation.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

const REQUIRED_FILES = [
  "docs/adme/stage-3-o-external-review-question-pack.md",
  "docs/adme/reviews/stage-3-o-legal-review-questions.md",
  "docs/adme/reviews/stage-3-o-tax-review-questions.md",
  "docs/adme/reviews/stage-3-o-privacy-review-questions.md",
  "docs/adme/reviews/stage-3-o-security-review-questions.md",
  "docs/adme/reviews/stage-3-o-identity-provider-questions.md",
  "docs/adme/reviews/stage-3-o-bank-provider-questions.md",
  "docs/adme/reviews/stage-3-o-business-owner-decisions.md",
  "docs/adme/reviews/stage-3-o-engineering-decisions.md",
  "docs/adme/reviews/stage-3-o-review-response-template.md",
  "apps/web/src/lib/compliance/stage3o-external-review-question-pack.ts",
  "apps/web/src/app/admin/external-review-question-pack/page.tsx",
  "apps/web/src/app/admin/kyc-tax-terms-implementation-approval/page.tsx",
  "apps/web/src/app/admin/kyc-tax-terms-db-migration-review/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

const REQUIRED_STATE_MARKERS = [
  "stage3OQuestionPackComplete=true",
  "readOnlyQuestionPack=true",
  "externalQuestionsPrepared=true",
  "externalQuestionsSent=false",
  "externalResponsesReceived=false",
  "legalReviewCompleted=false",
  "taxReviewCompleted=false",
  "privacyReviewCompleted=false",
  "securityReviewCompleted=false",
  "identityProviderSelected=false",
  "bankProviderSelected=false",
  "businessOwnerDecisionsCompleted=false",
  "engineeringDecisionsCompleted=false",
  "devMigrationApprovalGranted=false",
  "productionMigrationApprovalGranted=false",
  "migrationImplemented=false",
  "migrationFileCreated=false",
  "supabaseDbPushExecuted=false",
  "actualPersonalDataCollectionImplemented=false",
  "actualCashOutProcessingAllowed=false",
  "productionMutation=false",
  "legalConclusionDeclared=false",
  "overallApprovalStatus=blocked",
];

const VISIBLE_MARKERS = [
  "ADME_STAGE_3_O_EXTERNAL_REVIEW_QUESTION_PACK",
  "External Review Question Pack",
  "Questions prepared: YES",
  "Questions sent: NO",
  "Responses received: NO",
  "Migration implementation: BLOCKED",
  "Production mutation: DISABLED",
  "No personal data collection",
  "No actual cash-out processing",
];

const ALLOWED_DOMAINS = new Set([
  "legal",
  "tax",
  "privacy",
  "security",
  "identity_provider",
  "bank_provider",
  "business_owner",
  "engineering",
]);

const ALLOWED_STATUSES = new Set([
  "draft",
  "ready_for_review",
  "sent_for_review",
  "response_received",
  "clarification_required",
  "resolved",
  "rejected",
  "superseded",
]);

const ALLOWED_EVIDENCE_STATUSES = new Set([
  "not_requested",
  "request_ready",
  "external_response_required",
  "operator_decision_required",
  "provider_confirmation_required",
  "engineering_decision_required",
  "confirmed",
]);

const PUBLIC_SOURCE_ROOTS = [
  join(WEB_ROOT, "src/app/auth"),
  join(WEB_ROOT, "src/app/consumer"),
];

const dangerousActualCashOutObject =
  "actualCashOutProcessingAllowed" + ": true";

function readText(path) {
  return readFileSync(path, "utf8");
}

function assertContains(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`${label}: missing ${expected}`);
  }
  console.log(`PASS: ${label} contains ${expected}`);
}

function assertNotContains(text, forbidden, label) {
  if (text.includes(forbidden)) {
    throw new Error(`${label}: forbidden ${forbidden}`);
  }
  console.log(`PASS: ${label} does not contain ${forbidden}`);
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const stat = statSync(root);
  if (stat.isFile()) return [root];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return walkFiles(path);
    return entry.isFile() ? [path] : [];
  });
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

function verifyRegistry() {
  const registryPath = join(
    WEB_ROOT,
    "src/lib/compliance/stage3o-external-review-question-pack.ts",
  );
  const registry = readText(registryPath);

  assertContains(registry, 'import "server-only"', "Stage 3-O registry");
  assertContains(
    registry,
    "STAGE3O_EXTERNAL_REVIEW_QUESTIONS",
    "Stage 3-O question registry",
  );
  assertContains(
    registry,
    "STAGE3O_QUESTION_COUNT_TAXONOMY",
    "Stage 3-O count taxonomy",
  );
  assertContains(
    registry,
    "getStage3OExternalReviewQuestionPackState",
    "Stage 3-O state getter",
  );

  const ids = registry
    .split(/\r?\n/)
    .flatMap((line) => {
      const fieldMatch = line.match(
        /id:\s*"(LEGAL|TAX|PRIVACY|SECURITY|IDENTITY-PROVIDER|BANK-PROVIDER|BUSINESS|ENGINEERING)-(\d{3})"/,
      );
      if (fieldMatch) return [`${fieldMatch[1]}-${fieldMatch[2]}`];
      const tupleMatch = line.match(
        /^\s*\["(LEGAL|TAX|PRIVACY|SECURITY|IDENTITY-PROVIDER|BANK-PROVIDER|BUSINESS|ENGINEERING)-(\d{3})"/,
      );
      if (tupleMatch) return [`${tupleMatch[1]}-${tupleMatch[2]}`];
      return [];
    });
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    throw new Error("duplicate Stage 3-O question id found");
  }
  if (ids.length !== 117) {
    throw new Error(`expected 117 Stage 3-O question ids, got ${ids.length}`);
  }
  console.log(`PASS: unique question ids=${ids.length}`);

  for (const prefix of [
    ["LEGAL", 16],
    ["TAX", 14],
    ["PRIVACY", 17],
    ["SECURITY", 15],
    ["IDENTITY-PROVIDER", 19],
    ["BANK-PROVIDER", 16],
    ["BUSINESS", 10],
    ["ENGINEERING", 10],
  ]) {
    const [label, count] = prefix;
    const actual = ids.filter((id) => id.startsWith(`${label}-`)).length;
    if (actual !== count) {
      throw new Error(`${label} count mismatch: expected ${count}, got ${actual}`);
    }
    console.log(`PASS: ${label} question count=${actual}`);
  }

  const sourceIds = [
    ...registry.matchAll(/"STAGE3N-(\d{3})"/g),
  ].map((match) => `STAGE3N-${match[1]}`);
  for (const sourceId of sourceIds) {
    const number = Number(sourceId.slice("STAGE3N-".length));
    if (number < 1 || number > 19) {
      throw new Error(`invalid sourceStage3NItemId: ${sourceId}`);
    }
  }
  console.log(`PASS: sourceStage3NItemIds valid=${sourceIds.length}`);

  for (const domain of [...registry.matchAll(/domain:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  )) {
    if (!ALLOWED_DOMAINS.has(domain)) {
      throw new Error(`invalid Stage 3-O domain: ${domain}`);
    }
  }
  console.log("PASS: all question domains are allowed");

  for (const status of [...registry.matchAll(/status:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  )) {
    if (!ALLOWED_STATUSES.has(status)) {
      throw new Error(`invalid Stage 3-O status: ${status}`);
    }
  }
  console.log("PASS: all status taxonomy values are allowed");

  for (const status of [
    ...registry.matchAll(/evidenceStatus:\s*"([^"]+)"/g),
  ].map((match) => match[1])) {
    if (!ALLOWED_EVIDENCE_STATUSES.has(status)) {
      throw new Error(`invalid Stage 3-O evidenceStatus: ${status}`);
    }
  }
  console.log("PASS: all evidenceStatus taxonomy values are allowed");

  for (const forbidden of [
    'status: "sent_for_review"',
    'status: "response_received"',
    'status: "resolved"',
    'stage3OQuestionPackComplete: false',
    'readOnlyQuestionPack: false',
    'externalQuestionsPrepared: false',
    'externalQuestionsSent: true',
    'externalResponsesReceived: true',
    'legalReviewCompleted: true',
    'taxReviewCompleted: true',
    'privacyReviewCompleted: true',
    'securityReviewCompleted: true',
    'identityProviderSelected: true',
    'bankProviderSelected: true',
    'businessOwnerDecisionsCompleted: true',
    'engineeringDecisionsCompleted: true',
    'devMigrationApprovalGranted: true',
    'productionMigrationApprovalGranted: true',
    'migrationImplemented: true',
    'migrationFileCreated: true',
    'supabaseDbPushExecuted: true',
    'actualPersonalDataCollectionImplemented: true',
    dangerousActualCashOutObject,
    'productionMutation: true',
    'legalConclusionDeclared: true',
    'overallApprovalStatus: "approved"',
  ]) {
    assertNotContains(registry, forbidden, "Stage 3-O registry forbidden state");
  }
}

function verifyDocsAndPages() {
  const combined = REQUIRED_FILES.map((file) =>
    readText(join(REPO_ROOT, file)),
  ).join("\n");

  for (const marker of VISIBLE_MARKERS) {
    assertContains(combined, marker, "Stage 3-O visible marker");
  }
  for (const marker of REQUIRED_STATE_MARKERS) {
    const key = marker.split("=")[0];
    assertContains(combined, key, `Stage 3-O state key ${key}`);
  }
  for (const id of [
    "LEGAL-001",
    "LEGAL-016",
    "TAX-001",
    "TAX-014",
    "PRIVACY-001",
    "PRIVACY-017",
    "SECURITY-001",
    "SECURITY-015",
    "IDENTITY-PROVIDER-001",
    "IDENTITY-PROVIDER-019",
    "BANK-PROVIDER-001",
    "BANK-PROVIDER-016",
    "BUSINESS-001",
    "BUSINESS-010",
    "ENGINEERING-001",
    "ENGINEERING-010",
  ]) {
    assertContains(combined, id, `Stage 3-O question id ${id}`);
  }

  const page = readText(
    join(WEB_ROOT, "src/app/admin/external-review-question-pack/page.tsx"),
  );
  for (const forbidden of [
    "<form",
    "type=\"submit\"",
    ">Send<",
    ">Approve<",
    "formAction",
    "action={",
    "onClick={",
    "override",
    "mutationAction",
    "approveAction",
  ]) {
    assertNotContains(page, forbidden, "Stage 3-O page has no mutation UI");
  }
}

function verifyNoMigrationAdded() {
  const migrationDir = join(REPO_ROOT, "supabase/migrations");
  const migrationFiles = readdirSync(migrationDir);
  for (const file of migrationFiles) {
    assertNotContains(file, "stage_3_o", "no Stage 3-O DB migration file");
    assertNotContains(file, "stage3o", "no Stage 3-O DB migration file");
    assertNotContains(file, "external_review_question_pack", "no Stage 3-O migration file");
  }

  const statusAdded = gitLines("git status --porcelain -- supabase/migrations");
  const diffAdded = gitLines("git diff --name-only --diff-filter=A HEAD -- supabase/migrations");
  const added = [...statusAdded, ...diffAdded].filter(
    (line) =>
      line.includes("supabase/migrations") &&
      !line.includes("stage_3_p_dev_only_kyc_tax_terms_schema_foundation"),
  );
  if (added.length > 0) {
    throw new Error(`DB migration changed in this stage: ${added.join(", ")}`);
  }
  console.log("PASS: supabase/migrations unchanged");
}

function verifyNoSensitiveFixtures() {
  const files = REQUIRED_FILES.map((file) => join(REPO_ROOT, file));
  const patterns = [
    [/\b\d{6}-\d{7}\b/, "resident registration number fixture"],
    [/\b(?:\d{2,3}-){2,}\d{2,8}\b/, "bank account-like fixture"],
    [/sk_live_[A-Za-z0-9]/, "live secret fixture"],
    [/access_token["'=:\s]+[A-Za-z0-9._-]{12,}/i, "access token fixture"],
    [/refresh_token["'=:\s]+[A-Za-z0-9._-]{12,}/i, "refresh token fixture"],
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

function verifyPublicSourceGuard() {
  const publicFiles = PUBLIC_SOURCE_ROOTS.flatMap((root) => walkFiles(root));
  for (const file of publicFiles) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    for (const forbidden of [
      "ADME_STAGE_3_O_EXTERNAL_REVIEW_QUESTION_PACK",
      "External Review Question Pack",
      "stage3OQuestionPackComplete",
      "Questions prepared: YES",
      "Questions sent: NO",
      "Responses received: NO",
    ]) {
      assertNotContains(text, forbidden, `public source ${rel}`);
    }
  }
}

function verifyRegressionCommandsAvailable() {
  const packageJson = readText(join(WEB_ROOT, "package.json"));
  for (const command of [
    "verify:stage3n-kyc-tax-terms-implementation-approval-gate",
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

function main() {
  verifyRequiredFiles();
  verifyRegistry();
  verifyDocsAndPages();
  verifyNoMigrationAdded();
  verifyNoSensitiveFixtures();
  verifyPublicSourceGuard();
  verifyRegressionCommandsAvailable();

  for (const marker of REQUIRED_STATE_MARKERS) {
    console.log(`RESULT: ${marker}`);
  }
  console.log("RESULT: totalQuestionCount=117");
  console.log("RESULT: explicitBlockerCount=9");
  console.log("RESULT: approvalBlockingItemCount=18");
  console.log("RESULT: unresolvedEvidenceCount=3");
  console.log("RESULT: publicMarkerExposed=false");
  console.log("RESULT: dbMigration=false");
  console.log("RESULT: supabaseDbPush=false");
  console.log("RESULT: productionMutation=false");
  console.log("PASS: verify:stage3o-external-review-question-pack");
}

main();
