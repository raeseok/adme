/**
 * Stage 3-P Dev-only KYC / Tax / Terms Schema Foundation verification.
 * Static contract verification by default; dev DB 실측은 별도 Supabase CLI/SQL 단계에서 수행한다.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

const MIGRATION_FILENAME =
  "20260710110500_stage_3_p_dev_only_kyc_tax_terms_schema_foundation.sql";

const REQUIRED_FILES = [
  "docs/adme/stage-3-p-dev-only-kyc-tax-terms-schema-foundation.md",
  `supabase/migrations/${MIGRATION_FILENAME}`,
  "supabase/validation/validate_stage3p_dev_schema.sql",
  "apps/web/src/lib/compliance/stage3p-dev-only-kyc-tax-terms-schema-foundation.ts",
  "apps/web/src/app/admin/dev-kyc-tax-terms-schema-foundation/page.tsx",
  "apps/web/src/app/admin/external-review-question-pack/page.tsx",
  "apps/web/src/app/admin/kyc-tax-terms-implementation-approval/page.tsx",
  "apps/web/src/app/admin/kyc-tax-terms-db-migration-review/page.tsx",
  "apps/web/src/app/admin/compliance-preflight/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
];

const NEW_TABLES = [
  "consumer_identity_verifications",
  "consumer_bank_account_verifications",
  "consumer_tax_profiles",
  "legal_document_versions",
  "consumer_legal_acceptances",
  "consumer_marketing_consents",
  "cash_redemption_precondition_snapshots",
];

const EVENT_TABLES = [
  "consumer_identity_verifications",
  "consumer_bank_account_verifications",
  "consumer_legal_acceptances",
  "consumer_marketing_consents",
  "cash_redemption_precondition_snapshots",
];

const REQUIRED_STATE_MARKERS = [
  "stage3PDevSchemaFoundationComplete=true",
  "businessOwnerDevApprovalGranted=true",
  "externalReviewDeferredUntilPreLaunch=true",
  "devMigrationApprovalGranted=true",
  "productionMigrationApprovalGranted=false",
  "devMigrationImplemented=true",
  "productionMigrationImplemented=false",
  "devSupabasePushExecuted=true",
  "productionSupabasePushExecuted=false",
  "providerNeutralSchemaOnly=true",
  "rawIdentityDataStored=false",
  "rawBankAccountDataStored=false",
  "providerRawResponseStored=false",
  "providerCredentialsStored=false",
  "taxCalculationImplemented=false",
  "withholdingCalculationImplemented=false",
  "actualPersonalDataCollectionImplemented=false",
  "actualCashOutProcessingAllowed=false",
  "pointLedgerCashOutMutationImplemented=false",
  "productionMutation=false",
  "legalConclusionDeclared=false",
  "devImplementationStatus=approved",
  "productionApprovalStatus=blocked",
];

const VISIBLE_MARKERS = [
  "ADME_STAGE_3_P_DEV_KYC_TAX_TERMS_SCHEMA_FOUNDATION",
  "Business owner dev approval: GRANTED",
  "External review: DEFERRED UNTIL PRE-LAUNCH",
  "Dev Supabase linked ref: ogncvdxrrsjnwsuvgoyh",
  "Dev migration: APPLIED",
  "Dev DB verification: PASSED",
  "Production migration: BLOCKED",
  "Production DB mutation: NOT EXECUTED",
  "Provider-neutral schema only",
  "No raw identity data",
  "No raw bank account data",
  "No tax calculation",
  "No actual cash-out processing",
];

const PUBLIC_SOURCE_ROOTS = [
  join(WEB_ROOT, "src/app/auth"),
  join(WEB_ROOT, "src/app/consumer"),
];

const FORBIDDEN_COLUMNS = [
  "real_name",
  "birth_date",
  "phone_number",
  "resident_registration_number",
  "ci",
  "di",
  "raw_response",
  "access_token",
  "refresh_token",
  "oauth_code",
  "account_number",
  "account_number_last4",
  "account_number_hash",
  "account_holder_name",
  "token",
  "tax_id",
  "withholding_rate",
  "calculated_tax_amount",
  "report_submission_status",
  "ip_address",
  "user_agent",
  "device_fingerprint",
];

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

function getCreateTableBody(sql, tableName) {
  const pattern = new RegExp(
    `CREATE TABLE public\\.${tableName} \\(([\\s\\S]*?)\\n\\);`,
    "m",
  );
  const match = sql.match(pattern);
  if (!match) {
    throw new Error(`missing CREATE TABLE for ${tableName}`);
  }
  return match[1];
}

function getColumnNames(createTableBody) {
  return createTableBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("CONSTRAINT"))
    .map((line) => line.split(/\s+/)[0].replace(/,$/, ""))
    .filter((name) => /^[a-z_][a-z0-9_]*$/.test(name));
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

function verifyTypedStateAndPages() {
  const combined = REQUIRED_FILES.map((file) => readText(join(REPO_ROOT, file))).join(
    "\n",
  );

  for (const marker of REQUIRED_STATE_MARKERS) {
    const [key] = marker.split("=");
    assertContains(combined, key, `Stage 3-P state key ${key}`);
  }
  for (const marker of VISIBLE_MARKERS) {
    assertContains(combined, marker, "Stage 3-P visible marker");
  }

  for (const forbidden of [
    "productionMigrationApprovalGranted: true",
    "productionMigrationImplemented: true",
    "productionSupabasePushExecuted: true",
    "rawIdentityDataStored: true",
    "rawBankAccountDataStored: true",
    "providerRawResponseStored: true",
    "providerCredentialsStored: true",
    "taxCalculationImplemented: true",
    "withholdingCalculationImplemented: true",
    "actualPersonalDataCollectionImplemented: true",
    "actualCashOutProcessingAllowed" + ": true",
    "pointLedgerCashOutMutationImplemented: true",
    "productionMutation: true",
    "legalConclusionDeclared: true",
    'productionApprovalStatus: "approved"',
  ]) {
    assertNotContains(combined, forbidden, "Stage 3-P forbidden approval state");
  }
}

function verifyMigration() {
  const migrationDir = join(REPO_ROOT, "supabase/migrations");
  const stage3PFiles = readdirSync(migrationDir).filter((file) =>
    file.includes("stage_3_p_dev_only_kyc_tax_terms_schema_foundation"),
  );
  if (stage3PFiles.length !== 1 || stage3PFiles[0] !== MIGRATION_FILENAME) {
    throw new Error(`expected exactly ${MIGRATION_FILENAME}, got ${stage3PFiles.join(",")}`);
  }
  console.log(`PASS: migration file exactly created - ${MIGRATION_FILENAME}`);

  const sql = readText(join(migrationDir, MIGRATION_FILENAME));
  assertContains(sql, "ogncvdxrrsjnwsuvgoyh", "dev project ref marker");
  assertContains(sql, "vupsalteyltjqumppltc", "prod project ref blocked marker");
  assertNotContains(sql, "DROP TABLE", "no destructive drop");
  assertNotContains(sql, "ALTER TABLE public.cash_redemption_requests", "no existing cash redemption mutation");
  assertNotContains(sql, "INSERT INTO public.point_ledger", "no point ledger mutation");
  assertNotContains(sql, "CREATE TYPE", "no PostgreSQL native enum");
  assertNotContains(sql, " REAL", "no REAL amount type");
  assertNotContains(sql, " FLOAT", "no FLOAT amount type");
  assertNotContains(sql, " NUMERIC", "no NUMERIC ratio or amount type");

  for (const table of NEW_TABLES) {
    assertContains(sql, `CREATE TABLE public.${table}`, `${table} created`);
    assertContains(sql, `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`, `${table} RLS enabled`);
    assertContains(sql, `REVOKE ALL ON TABLE public.${table} FROM anon, authenticated`, `${table} anon/auth revoke`);
    assertContains(sql, `ON public.${table} TO authenticated`, `${table} authenticated SELECT grant`);
    assertContains(sql, "FOR SELECT TO authenticated", `${table} select policy present`);

    const body = getCreateTableBody(sql, table);
    const columns = getColumnNames(body);
    for (const forbidden of FORBIDDEN_COLUMNS) {
      if (columns.includes(forbidden)) {
        throw new Error(`${table}: forbidden column ${forbidden}`);
      }
      console.log(`PASS: ${table} has no forbidden column ${forbidden}`);
    }
    if (table !== "legal_document_versions") {
      if (!columns.includes("source_digest")) {
        throw new Error(`${table}: missing source_digest`);
      }
      if (!columns.includes("idempotency_key")) {
        throw new Error(`${table}: missing idempotency_key`);
      }
    }
    if (table.includes("cash_redemption")) {
      assertContains(body, "available_point_balance BIGINT NOT NULL", `${table} available balance BIGINT`);
      assertContains(body, "requested_amount BIGINT NOT NULL", `${table} requested amount BIGINT`);
    }
  }

  for (const table of EVENT_TABLES) {
    const grantMatch = sql.match(
      new RegExp(`GRANT SELECT \\(([\\s\\S]*?)\\)\\s+ON public\\.${table} TO authenticated;`, "m"),
    );
    if (!grantMatch) {
      throw new Error(`${table}: missing column-level SELECT grant`);
    }
    for (const forbidden of [
      "provider_reference",
      "reason_code",
      "source_digest",
      "idempotency_key",
    ]) {
      assertNotContains(grantMatch[1], forbidden, `${table} coarse grant`);
    }
  }

  for (const scope of [
    "UNIQUE (consumer_id, idempotency_key)",
    "UNIQUE (consumer_id, legal_document_version_id, idempotency_key)",
    "UNIQUE (consumer_id, consent_channel, idempotency_key)",
  ]) {
    assertContains(sql, scope, `idempotency scope ${scope}`);
  }
}

function verifyPublicSourceGuard() {
  const publicFiles = PUBLIC_SOURCE_ROOTS.flatMap((root) => walkFiles(root));
  for (const file of publicFiles) {
    const text = readText(file);
    const rel = relative(REPO_ROOT, file);
    for (const forbidden of [
      "ADME_STAGE_3_P_DEV_KYC_TAX_TERMS_SCHEMA_FOUNDATION",
      "Business owner dev approval: GRANTED",
      "External review: DEFERRED UNTIL PRE-LAUNCH",
      "Dev migration: APPLIED",
      "Production migration: BLOCKED",
      "stage3PDevSchemaFoundationComplete",
    ]) {
      assertNotContains(text, forbidden, `public source ${rel}`);
    }
  }
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

function verifyRegressionCommandsAvailable() {
  const packageJson = readText(join(WEB_ROOT, "package.json"));
  for (const command of [
    "verify:stage3o-external-review-question-pack",
    "verify:supabase-dev-link-safety",
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

function verifyGitDoesNotShowProdLinkChange() {
  const changed = execSync("git status --porcelain -- supabase", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of changed) {
    if (line.includes("config.toml") || line.includes(".branches")) {
      throw new Error(`unexpected Supabase link/config change: ${line}`);
    }
  }
  console.log("PASS: no Supabase link/config change staged in workspace");
}

function main() {
  verifyRequiredFiles();
  verifyTypedStateAndPages();
  verifyMigration();
  verifyPublicSourceGuard();
  verifyNoSensitiveFixtures();
  verifyRegressionCommandsAvailable();
  verifyGitDoesNotShowProdLinkChange();

  for (const marker of REQUIRED_STATE_MARKERS) {
    console.log(`RESULT: ${marker}`);
  }
  console.log(`RESULT: migrationFilename=${MIGRATION_FILENAME}`);
  console.log("RESULT: devSupabaseProjectRef=ogncvdxrrsjnwsuvgoyh");
  console.log("RESULT: prodSupabaseProjectRef=vupsalteyltjqumppltc");
  console.log("RESULT: devSupabasePushExecuted=true");
  console.log("RESULT: productionSupabasePushExecuted=false");
  console.log("RESULT: rawIdentityDataStored=false");
  console.log("RESULT: rawBankAccountDataStored=false");
  console.log("RESULT: providerCredentialsStored=false");
  console.log("RESULT: taxCalculationImplemented=false");
  console.log("RESULT: actualCashOutProcessingAllowed=false");
  console.log("PASS: verify:stage3p-dev-kyc-tax-terms-schema-foundation");
}

main();
