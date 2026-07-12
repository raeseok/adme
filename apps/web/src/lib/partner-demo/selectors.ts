import { calculateStage4BPartnerShare, calculateStage4BSettlement } from "./calculations";
import {
  STAGE4B_DEMO_ADVERTISERS,
  STAGE4B_DEMO_PARTNER,
  STAGE4B_DEMO_SETTLEMENTS,
  STAGE4B_MONTHLY_TRENDS,
} from "./fixtures";
import type { Stage4BPartnerDemoStore, Stage4BSettlement } from "./types";

export function selectStage4BAdvertisers(store: Stage4BPartnerDemoStore) {
  const search = store.searchQuery.trim().toLowerCase();
  return STAGE4B_DEMO_ADVERTISERS.filter((advertiser) => {
    if (
      store.selectedAdvertiserStatus !== "all" &&
      advertiser.status !== store.selectedAdvertiserStatus
    ) {
      return false;
    }
    if (store.selectedCategory !== "all" && advertiser.category !== store.selectedCategory) {
      return false;
    }
    if (!search) return true;
    return (
      advertiser.name.toLowerCase().includes(search) ||
      advertiser.category.toLowerCase().includes(search) ||
      advertiser.region.toLowerCase().includes(search)
    );
  }).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function selectStage4BSettlements(store: Stage4BPartnerDemoStore): Stage4BSettlement[] {
  return STAGE4B_DEMO_SETTLEMENTS.map((settlement) => ({
    ...settlement,
    status: store.settlementStatusById[settlement.id] ?? settlement.status,
  }));
}

export function selectStage4BDashboardTotals(store: Stage4BPartnerDemoStore) {
  const advertisers = STAGE4B_DEMO_ADVERTISERS;
  const settlements = selectStage4BSettlements(store);
  const campaigns = advertisers.flatMap((advertiser) => advertiser.campaigns);
  const monthSpentWon = campaigns.reduce((sum, campaign) => sum + campaign.spentWon, 0);
  const monthPartnerShareWon = calculateStage4BPartnerShare(
    monthSpentWon,
    STAGE4B_DEMO_PARTNER.shareRatePercent,
  );
  const pendingSettlementWon = settlements
    .filter((settlement) => settlement.status === "pending" || settlement.status === "approved")
    .reduce((sum, settlement) => sum + calculateStage4BSettlement(settlement).finalPayoutWon, 0);
  const paidSettlementWon = settlements
    .filter((settlement) => settlement.status === "paid")
    .reduce((sum, settlement) => sum + calculateStage4BSettlement(settlement).finalPayoutWon, 0);

  return {
    advertiserCount: advertisers.length,
    activeAdvertiserCount: advertisers.filter((advertiser) => advertiser.status === "active").length,
    activeCampaignCount: campaigns.filter((campaign) => campaign.status === "active").length,
    monthSpentWon,
    monthPartnerShareWon,
    pendingSettlementWon,
    paidSettlementWon,
    trends: STAGE4B_MONTHLY_TRENDS.map((row) => ({
      ...row,
      partnerShareWon: calculateStage4BPartnerShare(
        row.spentWon,
        STAGE4B_DEMO_PARTNER.shareRatePercent,
      ),
    })),
  };
}

export function getStage4BAdvertiserTotals(advertiserId: string) {
  const advertiser = STAGE4B_DEMO_ADVERTISERS.find((item) => item.id === advertiserId);
  const campaigns = advertiser?.campaigns ?? [];
  const spentWon = campaigns.reduce((sum, campaign) => sum + campaign.spentWon, 0);
  return {
    campaignCount: campaigns.length,
    activeCampaignCount: campaigns.filter((campaign) => campaign.status === "active").length,
    spentWon,
    partnerShareWon: calculateStage4BPartnerShare(
      spentWon,
      STAGE4B_DEMO_PARTNER.shareRatePercent,
    ),
    verifiedViews: campaigns.reduce((sum, campaign) => sum + campaign.verifiedViews, 0),
    quizPasses: campaigns.reduce((sum, campaign) => sum + campaign.quizPasses, 0),
  };
}
