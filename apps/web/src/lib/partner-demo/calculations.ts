import { STAGE4B_PARTNER_SHARE_RATE_PERCENT } from "./constants";
import type { Stage4BSettlement } from "./types";

export function formatStage4BWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatStage4BNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function formatStage4BPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function calculateStage4BPartnerShare(
  spentWon: number,
  shareRatePercent = STAGE4B_PARTNER_SHARE_RATE_PERCENT,
) {
  return Math.floor((spentWon * shareRatePercent) / 100);
}

export function calculateStage4BSettlement(settlement: Stage4BSettlement) {
  const grossSpentWon = settlement.breakdown.reduce((sum, item) => sum + item.spentWon, 0);
  const basePartnerShareWon = calculateStage4BPartnerShare(
    grossSpentWon,
    settlement.shareRatePercent,
  );
  const adjustmentWon = settlement.adjustments.reduce(
    (sum, item) => sum + item.amountWon,
    0,
  );
  return {
    grossSpentWon,
    shareRatePercent: settlement.shareRatePercent,
    basePartnerShareWon,
    adjustmentWon,
    finalPayoutWon: basePartnerShareWon + adjustmentWon,
  };
}
