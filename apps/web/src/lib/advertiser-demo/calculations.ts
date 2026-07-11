import type { Stage4ABudgetEstimate } from "./types";

export function formatStage4APoints(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}

export function formatStage4ANumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function formatStage4APercent(numerator: number, denominator: number) {
  if (denominator <= 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function calculateStage4ABudgetEstimate({
  demoBudgetPoints,
  pointPerPass,
  estimatedVerifiedEngagements,
}: {
  demoBudgetPoints: number;
  pointPerPass: number;
  estimatedVerifiedEngagements: number;
}): Stage4ABudgetEstimate {
  const maximumRewardedEngagements =
    pointPerPass > 0 ? Math.floor(demoBudgetPoints / pointPerPass) : 0;
  const estimatedPointSpend =
    Math.min(maximumRewardedEngagements, estimatedVerifiedEngagements) * pointPerPass;

  return {
    maximumRewardedEngagements,
    estimatedPointSpend,
    estimatedRemainingBudget: demoBudgetPoints - estimatedPointSpend,
  };
}

export function estimateStage4AReach(input: {
  regionCount: number;
  categoryCount: number;
  dayCount: number;
  pointPerPass: number;
  minViewSeconds: number;
}) {
  const regionFactor = Math.max(1, input.regionCount) * 420;
  const categoryFactor = Math.max(1, input.categoryCount) * 160;
  const dayFactor = Math.max(1, input.dayCount) * 36;
  const rewardFactor = Math.floor(input.pointPerPass / 50) * 24;
  const viewPenalty = Math.max(0, input.minViewSeconds - 3) * 18;

  return Math.max(320, regionFactor + categoryFactor + dayFactor + rewardFactor - viewPenalty);
}

export function estimateStage4AVerifiedEngagements(estimatedReach: number) {
  return Math.floor((estimatedReach * 34) / 100);
}
