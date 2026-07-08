import "server-only";

/** Stage 3-B verify fixture campaign UUIDs — dev controlled integration only. */
export const STAGE3C_CONTROLLED_CAMPAIGN_IDS = new Set([
  "e2e00002-0000-4000-8000-000000000002",
  "e2e00004-0000-4000-8000-000000000004",
  "e2e00006-0000-4000-8000-000000000006",
  "e2e00008-0000-4000-8000-000000000008",
  "e2e0000a-0000-4000-8000-00000000000a",
]);

export function isStage3CControlledCampaignId(campaignId: string): boolean {
  return STAGE3C_CONTROLLED_CAMPAIGN_IDS.has(campaignId);
}
