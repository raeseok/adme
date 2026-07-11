import { STAGE4A_DEMO_CAMPAIGNS } from "./fixtures";
import type { Stage4ACampaign, Stage4ADemoStore } from "./types";

export function selectStage4ACampaigns(store: Stage4ADemoStore): Stage4ACampaign[] {
  return STAGE4A_DEMO_CAMPAIGNS.map((campaign) => ({
    ...campaign,
    status: store.statusByCampaignId[campaign.id] ?? campaign.status,
  }));
}

export function selectStage4ACampaign(store: Stage4ADemoStore, id?: string) {
  return (
    selectStage4ACampaigns(store).find((campaign) => campaign.id === id) ??
    selectStage4ACampaigns(store)[0]
  );
}

export function selectStage4ADashboardTotals(store: Stage4ADemoStore) {
  const campaigns = selectStage4ACampaigns(store);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");
  const pendingCampaigns = campaigns.filter((campaign) =>
    ["submitted", "under_review"].includes(campaign.status),
  );
  const verifiedViews = campaigns.reduce(
    (sum, campaign) => sum + campaign.metrics.verifiedViews,
    0,
  );
  const quizPasses = campaigns.reduce((sum, campaign) => sum + campaign.metrics.quizPasses, 0);
  const demoPointSpend = campaigns.reduce(
    (sum, campaign) => sum + campaign.metrics.demoPointSpend,
    0,
  );

  return {
    campaignCount: campaigns.length,
    activeCampaignCount: activeCampaigns.length,
    pendingCampaignCount: pendingCampaigns.length,
    verifiedViews,
    quizPasses,
    demoPointSpend,
    costPerVerifiedEngagement: quizPasses > 0 ? Math.floor(demoPointSpend / quizPasses) : 0,
  };
}
