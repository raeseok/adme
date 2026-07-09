import "server-only";

/**
 * Stage 3-D — Production reward release flags (design + parse only).
 * Never enables Production reward mutation in this Stage.
 * Client bundles must not import this module.
 */

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw === "") return defaultValue;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return defaultValue;
}

function parseOptionalPositiveInt(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseAllowlistIds(raw: string | undefined): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type RewardReleaseFlags = {
  killSwitch: boolean;
  productionRewardOpen: boolean;
  productionRewardPreflightOnly: boolean;
  allowlistEnabled: boolean;
  allowlistUserIds: string[];
  allowlistCampaignIds: string[];
  controlledMaxRewardCount: number | null;
  controlledMaxRewardAmountPerUser: number | null;
  controlledMaxTotalRewardAmount: number | null;
  controlledMaxCampaignSpend: number | null;
  controlledWindowStart: string | null;
  controlledWindowEnd: string | null;
  controlledOperatorApprovalRef: string | null;
  maxPointsPerUserPerDay: number | null;
  maxCampaignDailyBudget: number | null;
};

/**
 * Defaults keep Production blocked:
 * - kill switch ON
 * - reward open OFF
 * - preflight-only ON
 * - allowlist OFF
 */
export function getRewardReleaseFlags(): RewardReleaseFlags {
  return {
    killSwitch: parseBool(process.env.ADME_REWARD_KILL_SWITCH, true),
    productionRewardOpen: parseBool(
      process.env.ADME_PRODUCTION_REWARD_OPEN,
      false,
    ),
    productionRewardPreflightOnly: parseBool(
      process.env.ADME_PRODUCTION_REWARD_PREFLIGHT_ONLY,
      true,
    ),
    allowlistEnabled: parseBool(
      process.env.ADME_PRODUCTION_REWARD_ALLOWLIST_ENABLED,
      false,
    ),
    allowlistUserIds: parseAllowlistIds(
      process.env.ADME_PRODUCTION_REWARD_ALLOWLIST_USER_IDS,
    ),
    allowlistCampaignIds: parseAllowlistIds(
      process.env.ADME_PRODUCTION_REWARD_ALLOWLIST_CAMPAIGN_IDS,
    ),
    controlledMaxRewardCount: parseOptionalPositiveInt(
      process.env.ADME_CONTROLLED_REWARD_MAX_REWARD_COUNT,
    ),
    controlledMaxRewardAmountPerUser: parseOptionalPositiveInt(
      process.env.ADME_CONTROLLED_REWARD_MAX_AMOUNT_PER_USER,
    ),
    controlledMaxTotalRewardAmount: parseOptionalPositiveInt(
      process.env.ADME_CONTROLLED_REWARD_MAX_TOTAL_AMOUNT,
    ),
    controlledMaxCampaignSpend: parseOptionalPositiveInt(
      process.env.ADME_CONTROLLED_REWARD_MAX_CAMPAIGN_SPEND,
    ),
    controlledWindowStart:
      process.env.ADME_CONTROLLED_REWARD_WINDOW_START?.trim() || null,
    controlledWindowEnd:
      process.env.ADME_CONTROLLED_REWARD_WINDOW_END?.trim() || null,
    controlledOperatorApprovalRef:
      process.env.ADME_CONTROLLED_REWARD_OPERATOR_APPROVAL_REF?.trim() || null,
    maxPointsPerUserPerDay: parseOptionalPositiveInt(
      process.env.ADME_PRODUCTION_REWARD_MAX_POINTS_PER_USER_PER_DAY,
    ),
    maxCampaignDailyBudget: parseOptionalPositiveInt(
      process.env.ADME_PRODUCTION_REWARD_MAX_CAMPAIGN_DAILY_BUDGET,
    ),
  };
}

/** Stage 3-D: mutation remains blocked unless future explicit approval. */
export function isProductionRewardMutationBlockedByFlags(
  flags: RewardReleaseFlags = getRewardReleaseFlags(),
): boolean {
  if (flags.killSwitch) return true;
  if (!flags.productionRewardOpen) return true;
  if (flags.productionRewardPreflightOnly) return true;
  return false;
}

export function isAllowlistActive(
  flags: RewardReleaseFlags = getRewardReleaseFlags(),
): boolean {
  return (
    flags.allowlistEnabled &&
    flags.allowlistUserIds.length > 0 &&
    flags.allowlistCampaignIds.length > 0 &&
    !isProductionRewardMutationBlockedByFlags(flags)
  );
}
