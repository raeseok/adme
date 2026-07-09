/**
 * Stage 3-F cash-out manual approval design shared verify helpers.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertContains, assertNotContains, readText } from "./stage3e-helpers.mjs";

export const WEB_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
export const REPO_ROOT = join(WEB_ROOT, "..", "..");

export const STAGE3F_REQUIRED_MARKERS = [
  "stage3FCashOutManualApprovalDesign=true",
  "stage3FCashOutActualProcessing=false",
  "stage3FCashOutMutation=false",
  "stage3FCashOutAutoTransfer=false",
  "stage3FCashOutMinAmount=10000",
  "stage3FCashOutManualApprovalRequired=true",
  "stage3FCashOutDeleteRollbackAllowed=false",
  "stage3FCashOutAdjustmentReversalRequired=true",
  "stage3FCashOutAccountRawRecorded=false",
  "stage3FCashOutFullEmailRecorded=false",
  "stage3FProductionRewardOpenFlag=false",
  "stage3FRewardKillSwitch=true",
  "stage3FControlledAllowlistActive=false",
  "stage3FProductionRewardMutation=false",
  "stage3FPointLedgerMutation=false",
  "stage3FCampaignBudgetMutation=false",
  "stage3FUsersBalanceMutation=false",
  "stage3FAdViewsMutation=false",
  "stage3FPartnerSettlementsMutation=false",
  "stage3FCashOutProcessing=false",
];

export const STAGE3F_PUBLIC_FORBIDDEN_MARKERS = [
  "stage3F",
  "stage3f",
  "STAGE3F",
  "cashOut",
  "CashOut",
  "CashOutManualApproval",
  "accountRaw",
  "AccountRaw",
  "AccountRawRecorded",
  "fullEmail",
  "FullEmail",
  "FullEmailRecorded",
];

export const STAGE3F_PUBLIC_FORBIDDEN_VISIBLE_STRINGS = [
  "quiz_answer",
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
  "authorization code",
  "access token",
  "refresh token",
  "client secret",
  "bank account",
  "account raw",
  "full email",
];

export function expectedDeployCommit() {
  return execSync("git rev-parse --short HEAD", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

export function verifyStage3FSourceContract() {
  const state = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3f-cash-out-manual-approval.ts"),
  );
  const rewardPreflight = readText(
    join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"),
  );
  const diagnostics = readText(
    join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  );
  const cashOutPreflight = readText(
    join(WEB_ROOT, "src/app/admin/cash-out-preflight/page.tsx"),
  );
  const designDoc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-f-cash-out-manual-approval-design.md"),
  );
  const productPolicy = readText(
    join(REPO_ROOT, "docs/adme/product-policy-current.md"),
  );
  const roadmap = readText(join(REPO_ROOT, "docs/adme/stage-roadmap-current.md"));
  const decisionLog = readText(join(REPO_ROOT, "docs/adme/adme-decision-log.md"));

  assertContains(state, 'import "server-only"', "Stage 3-F SSOT server-only");
  assertContains(
    state,
    "stage3FCashOutManualApprovalDesign: true",
    "manual approval design marker source",
  );
  assertContains(
    state,
    "stage3FCashOutActualProcessing: false",
    "actual processing blocked source",
  );
  assertContains(
    state,
    "stage3FCashOutMinAmount: 10000",
    "minimum cash-out amount source",
  );
  assertContains(
    state,
    "stage3FCashOutDeleteRollbackAllowed: false",
    "delete rollback blocked source",
  );
  assertContains(
    state,
    "stage3FCashOutAdjustmentReversalRequired: true",
    "adjustment/reversal source",
  );
  assertContains(
    state,
    "stage3FProductionRewardOpenFlag: false",
    "reward open flag source",
  );
  assertContains(state, "stage3FRewardKillSwitch: true", "kill switch source");
  assertContains(
    state,
    "stage3FControlledAllowlistActive: false",
    "allowlist inactive source",
  );

  assertNotContains(state, ".insert(", "Stage 3-F SSOT insert-free");
  assertNotContains(state, ".update(", "Stage 3-F SSOT update-free");
  assertNotContains(state, ".delete(", "Stage 3-F SSOT delete-free");
  assertNotContains(state, ".rpc(", "Stage 3-F SSOT rpc-free");
  assertNotContains(
    cashOutPreflight,
    "<button",
    "cash-out preflight button-free",
  );

  assertContains(
    rewardPreflight,
    "getStage3FCashOutManualApprovalState",
    "reward-preflight Stage 3-F import",
  );
  assertContains(
    diagnostics,
    "getStage3FCashOutManualApprovalState",
    "diagnostics Stage 3-F import",
  );
  assertContains(
    cashOutPreflight,
    "getStage3FCashOutManualApprovalState",
    "cash-out preflight Stage 3-F import",
  );

  assertContains(designDoc, "최소 현금 전환 금액: **10,000P**", "design doc min amount");
  assertContains(designDoc, "DELETE rollback", "design doc delete rollback");
  assertContains(
    designDoc,
    "`cash_redemption_requests`",
    "design doc cash redemption table mapping",
  );
  assertContains(
    designDoc,
    "`cash_redemption`",
    "design doc cash redemption ledger mapping",
  );
  assertContains(
    designDoc,
    "`admin_adjustment`",
    "design doc adjustment ledger mapping",
  );
  assertContains(
    designDoc,
    "신규 `cash_out` 테이블",
    "design doc no new cash_out table",
  );
  assertContains(productPolicy, "Cash-out manual approval policy", "product policy cash-out section");
  assertContains(
    productPolicy,
    "`cash_redemption_requests`",
    "product policy cash redemption table mapping",
  );
  assertContains(
    productPolicy,
    "`cash_redemption`",
    "product policy cash redemption ledger mapping",
  );
  assertContains(
    productPolicy,
    "`admin_adjustment`",
    "product policy adjustment ledger mapping",
  );
  assertContains(roadmap, "Stage 3-F-Cash-out-Manual-Approval-Design", "roadmap Stage 3-F");
  assertContains(
    roadmap,
    "`cash_redemption_requests`",
    "roadmap cash redemption table mapping",
  );
  assertContains(decisionLog, "ADME-DECISION-20260709-009", "decision log Stage 3-F decision");
  assertContains(
    decisionLog,
    "`cash_redemption_requests`",
    "decision log cash redemption table mapping",
  );
  assertContains(
    decisionLog,
    "신규 `cash_out` 테이블",
    "decision log no new cash_out table",
  );
}
