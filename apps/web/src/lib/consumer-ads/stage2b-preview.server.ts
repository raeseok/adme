import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMinViewSeconds } from "./min-view";
import { gradeFixtureQuizAnswer, isFixtureCampaignId } from "./stage2a-fixtures.server";
import type { QuizSubmitPreviewResult } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type GradePreviewParams = {
  supabase: SupabaseClient | null;
  userId: string | null;
  campaignId: string;
  quizId: string;
  selectedOption: string;
  clientElapsedMs: number;
  minViewSeconds: number;
  rewardPointsPreview: number;
};

function buildPreviewResult(
  partial: Pick<
    QuizSubmitPreviewResult,
    "accepted" | "result" | "rewardPointsPreview" | "minViewRequiredSeconds" | "minViewClientSatisfied" | "nextAllowedAction"
  >,
): QuizSubmitPreviewResult {
  return {
    accepted: partial.accepted,
    result: partial.result,
    rewardPreviewOnly: true,
    rewardPointsPreview: partial.rewardPointsPreview,
    pointLedgerMutation: false,
    adViewsMutation: false,
    quizAnswerExposed: false,
    minViewRequiredSeconds: partial.minViewRequiredSeconds,
    minViewClientSatisfied: partial.minViewClientSatisfied,
    serverAuthoritativeMinView: false,
    nextAllowedAction: partial.nextAllowedAction,
  };
}

function invalidResult(minViewSeconds: number): QuizSubmitPreviewResult {
  return buildPreviewResult({
    accepted: false,
    result: "invalid",
    rewardPointsPreview: null,
    minViewRequiredSeconds: minViewSeconds,
    minViewClientSatisfied: false,
    nextAllowedAction: "입력값을 확인한 뒤 다시 시도해 주세요.",
  });
}

async function gradeViaRpc(
  supabase: SupabaseClient,
  quizId: string,
  selectedOption: string,
): Promise<boolean | "rpc_error"> {
  const { data, error } = await supabase.rpc("grade_quiz_answer", {
    p_quiz_id: quizId,
    p_submitted_answer: selectedOption,
  });

  if (error) return "rpc_error";
  return data === true;
}

/**
 * Stage 2-B preview only — no point_ledger/ad_views mutation.
 * Stage 2-B preview에서는 클라이언트 타이머 기준으로만 제출 가능 여부를 확인합니다.
 * 실제 지급 검증은 다음 단계에서 서버 기록 기반으로 처리됩니다.
 */
export async function gradeQuizPreview(
  params: GradePreviewParams,
): Promise<QuizSubmitPreviewResult> {
  const minViewSeconds = resolveMinViewSeconds(params.minViewSeconds);
  const { campaignId, quizId, selectedOption, clientElapsedMs, rewardPointsPreview } = params;

  if (!campaignId || !quizId || !selectedOption.trim()) {
    return invalidResult(minViewSeconds);
  }

  if (!isFixtureCampaignId(campaignId) && (!UUID_RE.test(campaignId) || !UUID_RE.test(quizId))) {
    return invalidResult(minViewSeconds);
  }

  const minViewClientSatisfied = clientElapsedMs >= minViewSeconds * 1000;
  if (!minViewClientSatisfied) {
    return buildPreviewResult({
      accepted: false,
      result: "not_allowed",
      rewardPointsPreview: null,
      minViewRequiredSeconds: minViewSeconds,
      minViewClientSatisfied: false,
      nextAllowedAction: "최소 열람 시간을 충족한 뒤 퀴즈를 제출해 주세요.",
    });
  }

  let answerMatched: boolean | null = null;

  if (isFixtureCampaignId(campaignId)) {
    answerMatched = gradeFixtureQuizAnswer(campaignId, selectedOption);
    if (answerMatched === null) {
      return invalidResult(minViewSeconds);
    }
  } else {
    if (!params.userId || !params.supabase) {
      return buildPreviewResult({
        accepted: false,
        result: "not_allowed",
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        minViewClientSatisfied: true,
        nextAllowedAction: "퀴즈 제출을 위해 로그인이 필요합니다.",
      });
    }

    const rpcResult = await gradeViaRpc(params.supabase, quizId, selectedOption);
    if (rpcResult === "rpc_error") {
      return buildPreviewResult({
        accepted: false,
        result: "invalid",
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        minViewClientSatisfied: true,
        nextAllowedAction: "퀴즈 제출을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
    answerMatched = rpcResult;
  }

  if (answerMatched) {
    return buildPreviewResult({
      accepted: true,
      result: "correct",
      rewardPointsPreview,
      minViewRequiredSeconds: minViewSeconds,
      minViewClientSatisfied: true,
      nextAllowedAction: "포인트 적립은 다음 단계에서 처리됩니다.",
    });
  }

  return buildPreviewResult({
    accepted: true,
    result: "incorrect",
    rewardPointsPreview: null,
    minViewRequiredSeconds: minViewSeconds,
    minViewClientSatisfied: true,
    nextAllowedAction: "오답입니다. 이번 단계에서는 정답을 공개하지 않습니다.",
  });
}
