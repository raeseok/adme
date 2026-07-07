"use server";

import { gradeQuizPreview } from "@/lib/consumer-ads/stage2b-preview.server";
import {
  recordAdViewStarted,
  submitQuizAttempt,
} from "@/lib/consumer-ads/stage2c-ad-views.server";
import { resolveMinViewSeconds } from "@/lib/consumer-ads/min-view";
import type {
  BeginAdViewActionResult,
  QuizSubmitAttemptInput,
  QuizSubmitAttemptResult,
  QuizSubmitPreviewInput,
  QuizSubmitPreviewResult,
} from "@/lib/consumer-ads/types";
import { createClient } from "@/lib/supabase/server";

export async function beginAdViewAction(
  campaignId: string,
  quizId: string,
): Promise<BeginAdViewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const result = await recordAdViewStarted(
    supabase,
    user?.id ?? null,
    campaignId,
    quizId,
  );

  return {
    started: result.started,
    serverAuthoritativeMinView: true,
    adViewsMutation: result.adViewsMutation,
    viewStartedAtMs: result.viewStartedAtMs,
    attemptsRemaining: result.attemptState.attemptsRemaining,
  };
}

export async function submitQuizAttemptAction(
  input: QuizSubmitAttemptInput,
  minViewSeconds: number,
  rewardPointsPreview: number,
): Promise<QuizSubmitAttemptResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return submitQuizAttempt({
    supabase,
    userId: user?.id ?? null,
    campaignId: input.campaignId,
    quizId: input.quizId,
    selectedOption: input.selectedOption,
    minViewSeconds: resolveMinViewSeconds(minViewSeconds),
    rewardPointsPreview,
  });
}

/** Stage 2-B historical action — unchanged client-timer preview path. */
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
