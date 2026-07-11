import { STAGE4A_ALLOWED_TRANSITIONS, STAGE4A_STATUS_LABELS } from "./constants";
import type { Stage4ACampaignStatus, Stage4ADemoEvent, Stage4ADemoStore } from "./types";

export type Stage4ATransitionResult =
  | { ok: true; store: Stage4ADemoStore }
  | { ok: false; message: string };

export function canStage4ATransition(
  from: Stage4ACampaignStatus,
  to: Stage4ACampaignStatus,
) {
  return (STAGE4A_ALLOWED_TRANSITIONS[from] as readonly Stage4ACampaignStatus[]).includes(to);
}

export function applyStage4ATransition({
  store,
  campaignId,
  nextStatus,
  label,
}: {
  store: Stage4ADemoStore;
  campaignId: string;
  nextStatus: Stage4ACampaignStatus;
  label: string;
}): Stage4ATransitionResult {
  const current = store.statusByCampaignId[campaignId];
  if (!current) {
    return { ok: false, message: "Demo campaign을 찾을 수 없습니다." };
  }
  if (!canStage4ATransition(current, nextStatus)) {
    return {
      ok: false,
      message: `Stage 4-A demo에서는 ${STAGE4A_STATUS_LABELS[current]} → ${STAGE4A_STATUS_LABELS[nextStatus]} 전이를 허용하지 않습니다.`,
    };
  }

  const nextEvent: Stage4ADemoEvent = {
    id: `${campaignId}-${nextStatus}-${(store.eventsByCampaignId[campaignId] ?? []).length + 1}`,
    campaignId,
    label,
    status: nextStatus,
  };

  return {
    ok: true,
    store: {
      ...store,
      statusByCampaignId: {
        ...store.statusByCampaignId,
        [campaignId]: nextStatus,
      },
      eventsByCampaignId: {
        ...store.eventsByCampaignId,
        [campaignId]: [...(store.eventsByCampaignId[campaignId] ?? []), nextEvent],
      },
      submittedCampaignId: nextStatus === "submitted" ? campaignId : store.submittedCampaignId,
    },
  };
}
