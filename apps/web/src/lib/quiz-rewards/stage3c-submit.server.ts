import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { STAGE3B_RPC_NAME } from "@/lib/stage3/stage3b-full-transaction";
import { evaluateStage3ERewardGuard } from "@/lib/rewards/reward-guards";
import { isStage3CControlledCampaignId } from "./stage3c-controlled-campaigns";
import { assertStage3CRewardMutationAllowed } from "./stage3c-env-gate";
import {
  buildStage3CIdempotencyKey,
  maskIdempotencyKeyForLog,
} from "./stage3c-idempotency";
import { mapStage3CResultToUx } from "./stage3c-result-map";
import {
  assertStage3CClientDtoSafe,
  sanitizeStage3BRpcResponse,
} from "./stage3c-sanitize";
import type {
  Stage3CResultCode,
  Stage3CSubmitResult,
  SubmitConsumerQuizForRewardInput,
} from "./stage3c-types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AdViewRow = {
  id: string;
  consumer_user_id: string;
  campaign_id: string;
};

function utcDayBounds(now = new Date()): { start: string; end: string } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function findTodayAdView(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<AdViewRow | null> {
  const { start, end } = utcDayBounds();
  const { data, error } = await supabase
    .from("ad_views")
    .select("id, consumer_user_id, campaign_id")
    .eq("consumer_user_id", userId)
    .eq("campaign_id", campaignId)
    .gte("viewed_at", start)
    .lt("viewed_at", end)
    .order("viewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as AdViewRow;
}

async function resolveSelectedOptionLabel(
  supabase: SupabaseClient,
  quizId: string,
  selectedOptionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("quizzes_public")
    .select("options")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data?.options || !Array.isArray(data.options)) {
    return null;
  }

  for (const [index, item] of data.options.entries()) {
    if (typeof item === "string" && `opt-${index}` === selectedOptionId) {
      return item;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const optionId =
        typeof record.id === "string"
          ? record.id
          : typeof record.optionId === "string"
            ? record.optionId
            : `opt-${index}`;
      if (optionId === selectedOptionId) {
        const label =
          typeof record.label === "string"
            ? record.label
            : typeof record.text === "string"
              ? record.text
              : null;
        return label;
      }
    }
  }

  return null;
}

async function readUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.role) return null;
  return String(data.role);
}

function buildResult(
  partial: Omit<Stage3CSubmitResult, "quizAnswerExposed">,
): Stage3CSubmitResult {
  const dto: Stage3CSubmitResult = {
    ...partial,
    quizAnswerExposed: false,
  };
  assertStage3CClientDtoSafe(dto);
  return dto;
}

function mapRpcException(message: string): Stage3CResultCode | null {
  if (message.includes("STAGE3B_PRODUCTION_BLOCKED")) {
    return "STAGE3B_PRODUCTION_BLOCKED";
  }
  if (message.includes("STAGE3B_AUTH_REQUIRED")) {
    return "STAGE3C_AUTH_REQUIRED";
  }
  return null;
}

export async function submitConsumerQuizForReward(params: {
  supabase: SupabaseClient | null;
  userId: string | null;
  input: SubmitConsumerQuizForRewardInput;
}): Promise<Stage3CSubmitResult> {
  const { input } = params;
  const controlledCampaign = isStage3CControlledCampaignId(input.campaignId);
  const envGate = assertStage3CRewardMutationAllowed();
  const productionBlocked = !envGate.allowed;

  if (productionBlocked) {
    const fraudDecision = evaluateStage3ERewardGuard({
      userId: params.userId,
      campaignId: input.campaignId,
    });
    const ux = mapStage3CResultToUx(
      "STAGE3C_PRODUCTION_REWARD_BLOCKED",
      null,
      true,
    );
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_PRODUCTION_REWARD_BLOCKED",
      message: fraudDecision.safe_message || ux.message,
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: true,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  if (
    !input.campaignId ||
    !input.quizId ||
    !input.selectedOptionId?.trim() ||
    !UUID_RE.test(input.campaignId) ||
    !UUID_RE.test(input.quizId)
  ) {
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_INVALID_INPUT",
      message: "입력값을 확인한 뒤 다시 시도해 주세요.",
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  if (!params.supabase || !params.userId) {
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_AUTH_REQUIRED",
      message: "퀴즈 제출을 위해 로그인이 필요합니다.",
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  const role = await readUserRole(params.supabase, params.userId);
  if (role !== "consumer") {
    const ux = mapStage3CResultToUx("STAGE3C_CONSUMER_ROLE_REQUIRED", null, false);
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_CONSUMER_ROLE_REQUIRED",
      message: ux.message,
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  if (!controlledCampaign) {
    const ux = mapStage3CResultToUx("STAGE3C_UNCONTROLLED_CAMPAIGN", null, false);
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_UNCONTROLLED_CAMPAIGN",
      message: ux.message,
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign: false,
    });
  }

  const selectedLabel = await resolveSelectedOptionLabel(
    params.supabase,
    input.quizId,
    input.selectedOptionId,
  );
  if (!selectedLabel) {
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_INVALID_INPUT",
      message: "선택지를 확인한 뒤 다시 시도해 주세요.",
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  const adView = await findTodayAdView(
    params.supabase,
    params.userId,
    input.campaignId,
  );
  if (!adView) {
    const ux = mapStage3CResultToUx("STAGE3C_AD_VIEW_NOT_FOUND", null, false);
    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_AD_VIEW_NOT_FOUND",
      message: ux.message,
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  const idempotencyKey = buildStage3CIdempotencyKey({
    userId: params.userId,
    adViewId: adView.id,
    campaignId: input.campaignId,
    quizId: input.quizId,
  });

  if (input.submitIntentId) {
    console.info(
      `stage3c submit intent=${input.submitIntentId.slice(0, 8)} key=${maskIdempotencyKeyForLog(idempotencyKey)}`,
    );
  }

  const { data, error } = await params.supabase.rpc(STAGE3B_RPC_NAME, {
    p_ad_view_id: adView.id,
    p_campaign_id: input.campaignId,
    p_quiz_id: input.quizId,
    p_selected_option: selectedLabel,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const mapped = mapRpcException(error.message ?? "");
    if (mapped) {
      const ux = mapStage3CResultToUx(mapped, null, mapped.includes("PRODUCTION"));
      return buildResult({
        accepted: false,
        resultCode: mapped,
        message: ux.message,
        rewarded: false,
        rewardAmount: null,
        remainingAttempts: null,
        attemptNo: null,
        idempotencyReplay: false,
        productionRewardBlocked: mapped.includes("PRODUCTION"),
        pointLedgerMutation: false,
        adViewsMutation: false,
        controlledCampaign,
      });
    }

    return buildResult({
      accepted: false,
      resultCode: "STAGE3C_UNKNOWN_ERROR",
      message:
        "퀴즈 제출 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      rewarded: false,
      rewardAmount: null,
      remainingAttempts: null,
      attemptNo: null,
      idempotencyReplay: false,
      productionRewardBlocked: false,
      pointLedgerMutation: false,
      adViewsMutation: false,
      controlledCampaign,
    });
  }

  const sanitized = sanitizeStage3BRpcResponse(
    (data ?? {}) as Record<string, unknown>,
  );
  const ux = mapStage3CResultToUx(
    sanitized.resultCode,
    sanitized.rewardAmount,
    false,
  );

  const rewarded = sanitized.resultCode === "STAGE3B_REWARDED";
  const pointLedgerMutation = rewarded;
  const adViewsMutation =
    sanitized.resultCode === "STAGE3B_REWARDED" ||
    sanitized.resultCode === "STAGE3B_WRONG_RETRY_ALLOWED" ||
    sanitized.resultCode === "STAGE3B_WRONG_FINAL_NO_REWARD";

  return buildResult({
    accepted:
      sanitized.resultCode === "STAGE3B_REWARDED" ||
      sanitized.resultCode === "STAGE3B_WRONG_RETRY_ALLOWED" ||
      sanitized.resultCode === "STAGE3B_WRONG_FINAL_NO_REWARD" ||
      sanitized.resultCode === "STAGE3B_IDEMPOTENT_DUPLICATE",
    resultCode: sanitized.resultCode,
    message: ux.message,
    rewarded,
    rewardAmount: ux.showRewardAmount ? sanitized.rewardAmount : null,
    remainingAttempts: sanitized.remainingAttempts,
    attemptNo: sanitized.attemptNo,
    idempotencyReplay: sanitized.idempotencyReplay,
    productionRewardBlocked: false,
    pointLedgerMutation,
    adViewsMutation,
    controlledCampaign,
  });
}
