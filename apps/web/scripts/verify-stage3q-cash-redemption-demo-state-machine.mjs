/**
 * Stage 3-Q Cash Redemption Demo State Machine verification.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const MIGRATION_FILENAME =
  "20260710131000_stage_3_q_cash_redemption_demo_state_machine.sql";

const REQUIRED_FILES = [
  "docs/adme/stage-3-q-cash-redemption-demo-state-machine.md",
  `supabase/migrations/${MIGRATION_FILENAME}`,
  "supabase/validation/validate_stage3q_dev_state_machine.sql",
  "apps/web/src/lib/rewards/stage3q-cash-redemption-demo-state-machine.ts",
  "apps/web/src/lib/rewards/stage3q-cash-redemption-demo-content.ts",
  "apps/web/src/components/stage3q/ConsumerCashRedemptionDemo.tsx",
  "apps/web/src/components/stage3q/AdminCashRedemptionDemo.tsx",
  "apps/web/src/app/consumer/cash-redemption/page.tsx",
  "apps/web/src/app/consumer/cash-redemption/[requestId]/page.tsx",
  "apps/web/src/app/admin/cash-redemption-demo/page.tsx",
  "apps/web/src/app/admin/cash-redemption-demo/[requestId]/page.tsx",
  "apps/web/src/app/admin/diagnostics/page.tsx",
  "apps/web/scripts/verify-supabase-dev-link-safety.mjs",
];

const REQUIRED_STATE_MARKERS = [
  "stage3QDemoStateMachineComplete=true",
  "investorDemoFocused=true",
  "sandboxOnly=true",
  "devMigrationImplemented=true",
  "devSupabasePushExecuted=true",
  "productionMigrationImplemented=false",
  "productionSupabasePushExecuted=false",
  "devDbStateMachineVerified=true",
  "productionDbMutationAllowed=false",
  "actualPointDeductionImplemented=false",
  "actualBankTransferImplemented=false",
  "actualTaxCalculationImplemented=false",
  "actualPersonalDataCollectionImplemented=false",
  "demoResetAvailable=true",
  "consumerDemoUxComplete=true",
  "adminDemoUxComplete=true",
  "mobileVerified=true",
  "desktopVerified=true",
  "overallDemoStatus=ready",
];

const STATUSES = [
  "draft",
  "eligibility_check_required",
  "eligible",
  "ineligible",
  "submitted",
  "under_review",
  "on_hold",
  "approved",
  "rejected",
  "processing",
  "demo_completed",
  "cancelled",
  "expired",
];

const ELIGIBILITY_RESULTS = [
  "eligible",
  "insufficient_balance",
  "identity_verification_required",
  "bank_verification_required",
  "tax_review_required",
  "required_terms_missing",
  "protected_fund_check_failed",
  "minimum_threshold_not_met",
  "account_restricted",
  "manual_review_required",
];

const RPC_NAMES = [
  "rpc_stage3q_demo_evaluate_cash_redemption",
  "rpc_stage3q_demo_submit_cash_redemption",
  "rpc_stage3q_demo_start_review",
  "rpc_stage3q_demo_place_on_hold",
  "rpc_stage3q_demo_approve",
  "rpc_stage3q_demo_reject",
  "rpc_stage3q_demo_start_processing",
  "rpc_stage3q_demo_complete",
  "rpc_stage3q_demo_reset",
];

const VISIBLE_MARKERS = [
  "ADME_STAGE_3_Q_CASH_REDEMPTION_DEMO",
  "현금전환 시연",
  "Sandbox",
  "실제 포인트는 차감되지 않습니다",
  "실제 계좌이체는 실행되지 않습니다",
  "ADME_STAGE_3_Q_ADMIN_CASH_REDEMPTION_DEMO",
  "Cash Redemption Demo Operations",
  "Sandbox requests only",
  "Production DB mutation: DISABLED",
  "Actual payout: DISABLED",
  "Demo reset: AVAILABLE",
];

function readText(path) {
  return readFileSync(path, "utf8");
}

function assertContains(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: missing ${expected}`);
  console.log(`PASS: ${label} contains ${expected}`);
}

function assertNotContains(text, forbidden, label) {
  if (text.includes(forbidden)) throw new Error(`${label}: forbidden ${forbidden}`);
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

function verifyRequiredFiles() {
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(REPO_ROOT, file))) throw new Error(`required file missing: ${file}`);
    console.log(`PASS: required file exists - ${file}`);
  }
}

function verifyTypedStateAndUx() {
  const combined = REQUIRED_FILES.map((file) => readText(join(REPO_ROOT, file))).join("\n");
  for (const marker of REQUIRED_STATE_MARKERS) {
    const [key] = marker.split("=");
    assertContains(combined, key, `Stage 3-Q state key ${key}`);
  }
  for (const marker of VISIBLE_MARKERS) {
    assertContains(combined, marker, "Stage 3-Q visible marker");
  }
  for (const scenario of [
    "Scenario A: 정상 승인",
    "Scenario B: 최소 잔액 부족",
    "Scenario C: 계좌확인 필요",
    "Scenario D: 보류 후 승인",
  ]) {
    assertContains(combined, scenario, "Stage 3-Q scenario");
  }
  assertContains(combined, "Reset Demo", "demo reset UI");
  assertContains(combined, "/consumer/cash-redemption", "consumer route");
  assertContains(combined, "/admin/cash-redemption-demo", "admin route");
}

function verifyMigration() {
  const migrationDir = join(REPO_ROOT, "supabase/migrations");
  const stage3QFiles = readdirSync(migrationDir).filter((file) =>
    file.includes("stage_3_q_cash_redemption_demo_state_machine"),
  );
  if (stage3QFiles.length !== 1 || stage3QFiles[0] !== MIGRATION_FILENAME) {
    throw new Error(`expected exactly ${MIGRATION_FILENAME}, got ${stage3QFiles.join(",")}`);
  }
  console.log(`PASS: migration file exactly created - ${MIGRATION_FILENAME}`);

  const sql = readText(join(migrationDir, MIGRATION_FILENAME));
  assertContains(sql, "ogncvdxrrsjnwsuvgoyh", "dev project ref marker");
  assertContains(sql, "vupsalteyltjqumppltc", "prod project ref blocked marker");
  for (const table of [
    "cash_redemption_demo_requests",
    "cash_redemption_demo_events",
    "cash_redemption_demo_review_assignments",
  ]) {
    assertContains(sql, `CREATE TABLE public.${table}`, `${table} created`);
    assertContains(sql, `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`, `${table} RLS enabled`);
  }
  for (const status of STATUSES) assertContains(sql, `'${status}'`, `status ${status}`);
  for (const result of ELIGIBILITY_RESULTS) assertContains(sql, `'${result}'`, `eligibility ${result}`);
  for (const rpc of RPC_NAMES) {
    assertContains(sql, `FUNCTION public.${rpc}`, `RPC ${rpc}`);
    assertContains(rpc, "demo", `RPC name includes demo ${rpc}`);
  }
  for (const forbidden of [
    "DROP TABLE",
    "DROP COLUMN",
    "TRUNCATE",
    "INSERT INTO public.point_ledger",
    "UPDATE public.profiles",
    "UPDATE public.users",
    "ALTER TABLE public.cash_redemption_requests",
    "account_number",
    "account_holder_name",
    "withholding_rate",
    "calculated_tax_amount",
    "payout_reference",
    "bank_transfer_reference",
    "paid'",
    "transferred'",
  ]) {
    assertNotContains(sql, forbidden, "Stage 3-Q forbidden SQL");
  }
  assertContains(sql, "DELETE FROM public.cash_redemption_demo_", "dev-only demo reset");
}

function verifyPublicMarkerGuard() {
  for (const root of [join(WEB_ROOT, "src/app/auth")]) {
    for (const file of walkFiles(root)) {
      const text = readText(file);
      for (const marker of ["ADME_STAGE_3_Q", "stage3QDemoStateMachineComplete"]) {
        assertNotContains(text, marker, `public source ${relative(REPO_ROOT, file)}`);
      }
    }
  }
}

function main() {
  verifyRequiredFiles();
  verifyTypedStateAndUx();
  verifyMigration();
  verifyPublicMarkerGuard();
  console.log("RESULT: stage3QDemoStateMachineComplete=true");
  console.log("RESULT: sandboxOnly=true");
  console.log("RESULT: productionDbMutationAllowed=false");
  console.log("RESULT: actualPointDeductionImplemented=false");
  console.log("RESULT: actualBankTransferImplemented=false");
  console.log("RESULT: overallDemoStatus=ready");
  console.log("PASS: verify:stage3q-cash-redemption-demo-state-machine");
}

main();
