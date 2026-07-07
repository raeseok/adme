"use server";

import { gradeQuizPreview } from "@/lib/consumer-ads/stage2b-preview.server";
import { resolveMinViewSeconds } from "@/lib/consumer-ads/min-view";
import type { QuizSubmitPreviewInput, QuizSubmitPreviewResult } from "@/lib/consumer-ads/types";
import { createClient } from "@/lib/supabase/server";

export async function submitQuizPreviewAction(
  input: QuizSubmitPreviewInput,
  minViewSeconds: number,
  rewardPointsPreview: number,
): Promise<QuizSubmitPreviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const result = await gradeQuizPreview({
    supabase,
    userId: user?.id ?? null,
    campaignId: input.campaignId,
    quizId: input.quizId,
    selectedOption: input.selectedOption,
    clientElapsedMs: input.clientElapsedMs,
    minViewSeconds: resolveMinViewSeconds(minViewSeconds),
    rewardPointsPreview,
  });

  return {
    accepted: result.accepted,
    result: result.result,
    rewardPreviewOnly: true,
    rewardPointsPreview: result.rewardPointsPreview,
    pointLedgerMutation: false,
    adViewsMutation: false,
    quizAnswerExposed: false,
    minViewRequiredSeconds: result.minViewRequiredSeconds,
    minViewClientSatisfied: result.minViewClientSatisfied,
    serverAuthoritativeMinView: false,
    nextAllowedAction: result.nextAllowedAction,
  };
}
