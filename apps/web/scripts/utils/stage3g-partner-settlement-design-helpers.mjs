/**
 * Stage 3-G partner settlement manual approval design shared verify helpers.
 */
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertContains, assertNotContains, readText, walkFiles } from "./stage3e-helpers.mjs";

export const WEB_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
export const REPO_ROOT = join(WEB_ROOT, "..", "..");

export const STAGE3G_REQUIRED_MARKERS = [
  "stage3GPartnerSettlementManualApprovalDesign=true",
  "stage3GPartnerSettlementActualProcessing=false",
  "stage3GPartnerSettlementMutation=false",
  "stage3GMonthlyCloseBatch=false",
  "stage3GPartnerSettlementAutoPayout=false",
  "stage3GAdvertiserPartnerAttributionLocked=true",
  "stage3GDynamicPartnerLookupAllowed=false",
  "stage3GQuizPassPartnerShareCalculation=false",
  "stage3GMonthlyCloseRequired=true",
  "stage3GNextMonthPayoutDay=15",
  "stage3GShareRateSnapshotRequired=true",
  "stage3GSettlementIdempotencyRequired=true",
  "stage3GSettlementUniqueKeyRequired=true",
  "stage3GSettlementStatusMachineRequired=true",
  "stage3GPaidUpdateBlockedRequired=true",
  "stage3GChargebackNextMonthRequired=true",
  "stage3GPartnerTerminationStatusRequired=true",
  "stage3GAdvertiserPartnerIdNullAllowed=false",
  "stage3GProductionRewardOpenFlag=false",
  "stage3GRewardKillSwitch=true",
  "stage3GControlledAllowlistActive=false",
  "stage3GProductionRewardMutation=false",
  "stage3GPointLedgerMutation=false",
  "stage3GCampaignBudgetMutation=false",
  "stage3GUsersBalanceMutation=false",
  "stage3GAdViewsMutation=false",
  "stage3GPartnerSettlementsMutation=false",
  "stage3GCashRedemptionRequestsMutation=false",
];

export const STAGE3G_REQUIRED_VISIBLE_STRINGS = [
  "Partner Settlement Manual Approval Design",
  "Actual partner settlement processing is blocked",
  "Monthly close batch is not implemented",
  "Partner payout action is not implemented",
  "advertisers.partner_id attribution is locked",
];

export const STAGE3G_PUBLIC_FORBIDDEN_MARKERS = [
  "stage3G",
  "stage3g",
  "STAGE3G",
  "PartnerSettlementManualApproval",
  "Partner Settlement Manual Approval Design",
  "advertisers.partner_id",
  "partner_settlements",
  "share_rate_snapshot",
  "settlement_month",
  "chargeback",
];

export const STAGE3G_PUBLIC_FORBIDDEN_VISIBLE_STRINGS = [
  "secret",
  "token",
  "quiz_answer",
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
];

export function expectedDeployCommit() {
  return execSync("git rev-parse --short HEAD", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

function assertNoForbiddenSourceMutations(label, text) {
  assertNotContains(text, ".insert(", `${label} insert-free`);
  assertNotContains(text, ".update(", `${label} update-free`);
  assertNotContains(text, ".delete(", `${label} delete-free`);
  assertNotContains(text, ".upsert(", `${label} upsert-free`);
  assertNotContains(text, ".rpc(", `${label} rpc-free`);
}

export function verifyStage3GSourceContract() {
  const state = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3g-partner-settlement-manual-approval.ts"),
  );
  const rewardPreflight = readText(
    join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"),
  );
  const diagnostics = readText(join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"));
  const partnerSettlementPreflight = readText(
    join(WEB_ROOT, "src/app/admin/partner-settlement-preflight/page.tsx"),
  );
  const designDoc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-g-partner-settlement-manual-approval-design.md"),
  );
  const attributionPolicy = readText(
    join(REPO_ROOT, "docs/adme/stage-3-g-partner-settlement-attribution-policy.md"),
  );
  const productPolicy = readText(join(REPO_ROOT, "docs/adme/product-policy-current.md"));
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(state, 'import "server-only"', "Stage 3-G SSOT server-only");
  for (const marker of STAGE3G_REQUIRED_MARKERS) {
    const [key, value] = marker.split("=");
    assertContains(state, `${key}: ${value}`, `Stage 3-G SSOT ${key}`);
  }
  assertNoForbiddenSourceMutations("Stage 3-G SSOT", state);
  assertNoForbiddenSourceMutations("partner settlement preflight", partnerSettlementPreflight);
  assertNotContains(partnerSettlementPreflight, "<button", "partner settlement preflight button-free");

  assertContains(
    rewardPreflight,
    "getStage3GPartnerSettlementManualApprovalState",
    "reward-preflight Stage 3-G import",
  );
  assertContains(
    diagnostics,
    "getStage3GPartnerSettlementManualApprovalState",
    "diagnostics Stage 3-G import",
  );
  assertContains(
    partnerSettlementPreflight,
    "getStage3GPartnerSettlementManualApprovalState",
    "partner-settlement-preflight Stage 3-G import",
  );

  const policySources = [
    ["design doc", designDoc],
    ["attribution policy", attributionPolicy],
    ["product policy", productPolicy],
    ["roadmap", roadmap],
    ["decision log", decisionLog],
  ];
  for (const [label, text] of policySources) {
    assertContains(text, "advertisers.partner_id", `${label} advertiser attribution`);
    assertContains(text, "partner_settlements", `${label} partner settlements`);
    assertContains(text, "monthly close", `${label} monthly close`);
    assertContains(text, "settlement_share_rate_snapshot", `${label} share rate snapshot`);
    assertContains(text, "(partner_id, settlement_month)", `${label} unique idempotency`);
    assertContains(text, "pending -> confirmed -> paid", `${label} status machine`);
    assertContains(text, "paid update", `${label} paid update block`);
    assertContains(text, "chargeback next month", `${label} chargeback next month`);
    assertContains(text, "partners.status", `${label} partner status`);
    assertContains(text, "terminated", `${label} terminated partner`);
    assertContains(text, "do not null advertiser partner_id", `${label} no null advertiser partner`);
  }

  assertContains(designDoc, "이번 Stage에서는 DB migration이 없다", "design doc no DB migration");
  assertContains(designDoc, "`partner_settlements` INSERT/UPDATE/DELETE", "design doc no settlement mutation");
  assertContains(designDoc, "quiz pass 시점 partner share 계산", "design doc quiz-pass share blocked");
  assertContains(productPolicy, "Stage 3-G-Partner-Settlement-Manual-Approval-Design", "product policy Stage 3-G");
  assertContains(roadmap, "verify:stage3g-partner-settlement-design", "roadmap Stage 3-G verify");
  assertContains(decisionLog, "ADME-DECISION-20260709-011", "decision log Stage 3-G decision");

  const migrationFiles = readdirSync(join(REPO_ROOT, "supabase/migrations"));
  for (const file of migrationFiles) {
    assertNotContains(file, "stage_3_g", "no Stage 3-G DB migration file");
    assertNotContains(file, "partner_settlement_manual", "no partner settlement manual DB migration file");
  }

  const sqlFiles = walkFiles(join(REPO_ROOT, "supabase")).filter((file) => file.endsWith(".sql"));
  for (const file of sqlFiles) {
    const sql = readText(file);
    assertNotContains(sql, "rpc_stage3g", `${file} no Stage 3-G settlement RPC`);
    assertNotContains(sql, "monthly_close_partner", `${file} no monthly close RPC`);
    assertNotContains(sql, "paid update trigger", `${file} no paid update trigger actual migration`);
  }
}
