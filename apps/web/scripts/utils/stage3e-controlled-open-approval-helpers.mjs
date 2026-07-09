/**
 * Stage 3-E-Controlled-Open-Approval shared read-only verify helpers.
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

export const STAGE3E_APPROVAL_REQUIRED_MARKERS = [
  "stage3EControlledOpenApproval=true",
  "stage3EControlledOpenApprovalOnly=true",
  "stage3EActualOpenExecuted=false",
  "stage3EProductionRewardOpenFlag=false",
  "stage3ERewardKillSwitch=true",
  "stage3EControlledAllowlistActive=false",
  "stage3EControlledMaxUsers=2",
  "stage3EControlledMaxCampaigns=1",
  "stage3EControlledMaxRewardCountPerUser=1",
  "stage3EControlledMaxRewardAmountPerUser=500",
  "stage3EControlledMaxTotalRewardAmount=1000",
  "stage3ECashOutProcessing=false",
  "stage3EPartnerSettlementProcessing=false",
  "stage3EStage3BProductionBlockPreserved=true",
  "stage3EStage3CProductionRewardBlockPreserved=true",
];

export const STAGE3E_APPROVAL_PUBLIC_FORBIDDEN_MARKERS = [
  "stage3E",
  "stage3EControlledOpen",
  "stage3EProductionReward",
  "stage3ERewardKillSwitch",
];

export const STAGE3E_APPROVAL_PUBLIC_FORBIDDEN_VISIBLE_STRINGS = [
  "secret",
  "token",
  "authorization code",
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

export function verifyApprovalSourceContract() {
  const approval = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3e-controlled-open-approval.ts"),
  );
  const rewardPreflight = readText(
    join(WEB_ROOT, "src/app/admin/reward-preflight/page.tsx"),
  );
  const diagnostics = readText(
    join(WEB_ROOT, "src/app/admin/diagnostics/page.tsx"),
  );

  assertContains(approval, 'import "server-only"', "approval SSOT server-only");
  assertContains(
    approval,
    "stage3EControlledOpenApproval: true",
    "approval marker source",
  );
  assertContains(
    approval,
    "stage3EActualOpenExecuted: false",
    "actual open blocked source",
  );
  assertContains(
    approval,
    "stage3EProductionRewardOpenFlag: false",
    "reward open flag source",
  );
  assertContains(
    approval,
    "stage3ERewardKillSwitch: true",
    "kill switch source",
  );
  assertContains(
    approval,
    "stage3EControlledAllowlistActive: false",
    "allowlist inactive source",
  );
  assertContains(
    approval,
    "stage3EControlledMaxTotalRewardAmount: 1000",
    "total approval cap source",
  );
  assertContains(
    approval,
    "stage3EStage3BProductionBlockPreserved: true",
    "Stage 3-B block source",
  );
  assertContains(
    approval,
    "stage3EStage3CProductionRewardBlockPreserved: true",
    "Stage 3-C block source",
  );
  assertContains(
    rewardPreflight,
    "getStage3EControlledOpenApprovalState",
    "reward-preflight approval import",
  );
  assertContains(
    diagnostics,
    "getStage3EControlledOpenApprovalState",
    "diagnostics approval import",
  );
  assertNotContains(
    approval,
    "ADME_PRODUCTION_REWARD_OPEN",
    "approval SSOT env-independent",
  );
  assertNotContains(
    approval,
    "ADME_PRODUCTION_REWARD_ALLOWLIST_ENABLED",
    "approval allowlist env-independent",
  );
}
