import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMinViewSeconds } from "./min-view";
import { gradeFixtureQuizAnswer, isFixtureCampaignId } from "./stage2a-fixtures.server";
import {
  beginFixtureAdView,
  readFixtureViewState,
  updateFixtureViewState,
  type FixtureViewState,
} from "./stage2c-fixture-views.server";
import type { QuizSubmitAttemptResult } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_ATTEMPTS = 2;

type AdViewRow = {
  id: string;
  consumer_user_id: string;
  campaign_id: string;
  quiz_id: string | null;
  status: "viewed" | "quiz_submitted" | "rewarded" | "failed";
  points_earned: number;
  viewed_at: string;
  view_started_at: string | null;
  attempt_no: number;
  created_at: string;
};

export type AdViewAttemptState = {
  viewStartedAtMs: number | null;
  attemptNo: number;
  lastResult: "correct" | "incorrect" | null;
  completed: boolean;
  attemptLimitReached: boolean;
  rewardPreviewAvailable: boolean;
  attemptsRemaining: number;
  adViewsMutation: boolean;
};

export type BeginAdViewResult = {
  started: boolean;
  serverAuthoritativeMinView: true;
  adViewsMutation: boolean;
  viewStartedAtMs: number | null;
  attemptState: AdViewAttemptState;
};

function utcDayBounds(now = new Date()): { start: string; end: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function elapsedSecondsFromMs(viewStartedAtMs: number): number {
  return Math.max(0, Math.floor((Date.now() - viewStartedAtMs) / 1000));
}

function mapFixtureState(state: FixtureViewState, adViewsMutation: boolean): AdViewAttemptState {
  const attemptsRemaining = state.completed
    ? 0
    : state.attemptLimitReached
      ? 0
      : Math.max(0, MAX_ATTEMPTS - state.attemptNo);

  return {
    viewStartedAtMs: state.viewStartedAtMs,
    attemptNo: state.attemptNo,
    lastResult: state.lastResult,
    completed: state.completed,
    attemptLimitReached: state.attemptLimitReached,
    rewardPreviewAvailable: state.lastResult === "correct" && !state.attemptLimitReached,
    attemptsRemaining,
    adViewsMutation,
  };
}

function mapDbRow(row: AdViewRow): AdViewAttemptState {
  const viewStartedAtMs = row.view_started_at
    ? new Date(row.view_started_at).getTime()
    : new Date(row.viewed_at).getTime();

  const completed = row.status === "quiz_submitted" || row.status === "rewarded";
  const attemptLimitReached = row.status === "failed" || row.attempt_no >= MAX_ATTEMPTS;
  const lastResult =
    row.status === "quiz_submitted" || row.status === "rewarded"
      ? ("correct" as const)
      : row.status === "failed"
        ? ("incorrect" as const)
        : row.attempt_no > 0 && row.status === "viewed"
          ? ("incorrect" as const)
          : null;

  const attemptsRemaining = completed
    ? 0
    : attemptLimitReached
      ? 0
      : Math.max(0, MAX_ATTEMPTS - row.attempt_no);

  return {
    viewStartedAtMs,
    attemptNo: row.attempt_no,
    lastResult,
    completed,
    attemptLimitReached,
    rewardPreviewAvailable: completed && !attemptLimitReached,
    attemptsRemaining,
    adViewsMutation: true,
  };
}

async function findTodayAdView(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<AdViewRow | null> {
  const { start, end } = utcDayBounds();
  const { data, error } = await supabase
    .from("ad_views")
    .select(
      "id, consumer_user_id, campaign_id, quiz_id, status, points_earned, viewed_at, view_started_at, attempt_no, created_at",
    )
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

export async function getAdViewAttemptState(
  supabase: SupabaseClient | null,
  userId: string | null,
  campaignId: string,
): Promise<AdViewAttemptState> {
  if (isFixtureCampaignId(campaignId)) {
    const fixture = await readFixtureViewState(campaignId);
    if (!fixture) {
      return {
        viewStartedAtMs: null,
        attemptNo: 0,
        lastResult: null,
        completed: false,
        attemptLimitReached: false,
        rewardPreviewAvailable: false,
        attemptsRemaining: MAX_ATTEMPTS,
        adViewsMutation: false,
      };
    }
    return mapFixtureState(fixture, false);
  }

  if (!supabase || !userId) {
    return {
      viewStartedAtMs: null,
      attemptNo: 0,
      lastResult: null,
      completed: false,
      attemptLimitReached: false,
      rewardPreviewAvailable: false,
      attemptsRemaining: MAX_ATTEMPTS,
      adViewsMutation: false,
    };
  }

  const row = await findTodayAdView(supabase, userId, campaignId);
  if (!row) {
    return {
      viewStartedAtMs: null,
      attemptNo: 0,
      lastResult: null,
      completed: false,
      attemptLimitReached: false,
      rewardPreviewAvailable: false,
      attemptsRemaining: MAX_ATTEMPTS,
      adViewsMutation: false,
    };
  }

  return mapDbRow(row);
}

export async function recordAdViewStarted(
  supabase: SupabaseClient | null,
  userId: string | null,
  campaignId: string,
  quizId: string | null,
): Promise<BeginAdViewResult> {
  if (isFixtureCampaignId(campaignId)) {
    const state = await beginFixtureAdView(campaignId);
    return {
      started: true,
      serverAuthoritativeMinView: true,
      adViewsMutation: false,
      viewStartedAtMs: state.viewStartedAtMs,
      attemptState: mapFixtureState(state, false),
    };
  }

  if (!supabase || !userId) {
    return {
      started: false,
      serverAuthoritativeMinView: true,
      adViewsMutation: false,
      viewStartedAtMs: null,
      attemptState: await getAdViewAttemptState(supabase, userId, campaignId),
    };
  }

  const existing = await findTodayAdView(supabase, userId, campaignId);
  if (existing) {
    return {
      started: true,
      serverAuthoritativeMinView: true,
      adViewsMutation: true,
      viewStartedAtMs: mapDbRow(existing).viewStartedAtMs,
      attemptState: mapDbRow(existing),
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ad_views")
    .insert({
      consumer_user_id: userId,
      campaign_id: campaignId,
      quiz_id: quizId,
      status: "viewed",
      points_earned: 0,
      viewed_at: now,
      view_started_at: now,
      attempt_no: 0,
    })
    .select(
      "id, consumer_user_id, campaign_id, quiz_id, status, points_earned, viewed_at, view_started_at, attempt_no, created_at",
    )
    .single();

  if (error || !data) {
    const retry = await findTodayAdView(supabase, userId, campaignId);
    if (retry) {
      return {
        started: true,
        serverAuthoritativeMinView: true,
        adViewsMutation: true,
        viewStartedAtMs: mapDbRow(retry).viewStartedAtMs,
        attemptState: mapDbRow(retry),
      };
    }

    return {
      started: false,
      serverAuthoritativeMinView: true,
      adViewsMutation: false,
      viewStartedAtMs: null,
      attemptState: await getAdViewAttemptState(supabase, userId, campaignId),
    };
  }

  const row = data as AdViewRow;
  return {
    started: true,
    serverAuthoritativeMinView: true,
    adViewsMutation: true,
    viewStartedAtMs: mapDbRow(row).viewStartedAtMs,
    attemptState: mapDbRow(row),
  };
}

export function assertServerMinViewSatisfied(
  viewStartedAtMs: number | null,
  minViewSeconds: number,
): { satisfied: boolean; serverElapsedSeconds: number | null } {
  if (viewStartedAtMs == null) {
    return { satisfied: false, serverElapsedSeconds: null };
  }
  const serverElapsedSeconds = elapsedSecondsFromMs(viewStartedAtMs);
  return {
    satisfied: serverElapsedSeconds >= minViewSeconds,
    serverElapsedSeconds,
  };
}

function buildAttemptResult(
  partial: Pick<
    QuizSubmitAttemptResult,
    | "accepted"
    | "result"
    | "rewardPreviewAvailable"
    | "rewardPointsPreview"
    | "minViewRequiredSeconds"
    | "serverElapsedSeconds"
    | "attemptNo"
    | "attemptsRemaining"
    | "nextAllowedAction"
  >,
  adViewsMutation: boolean,
): QuizSubmitAttemptResult {
  return {
    accepted: partial.accepted,
    result: partial.result,
    rewardPreviewOnly: true,
    rewardPreviewAvailable: partial.rewardPreviewAvailable,
    rewardPointsPreview: partial.rewardPointsPreview,
    pointLedgerMutation: false,
    adViewsMutation,
    quizAnswerExposed: false,
    minViewRequiredSeconds: partial.minViewRequiredSeconds,
    serverAuthoritativeMinView: true,
    serverElapsedSeconds: partial.serverElapsedSeconds,
    attemptNo: partial.attemptNo,
    attemptsRemaining: partial.attemptsRemaining,
    nextAllowedAction: partial.nextAllowedAction,
  };
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

type SubmitAttemptParams = {
  supabase: SupabaseClient | null;
  userId: string | null;
  campaignId: string;
  quizId: string;
  selectedOption: string;
  minViewSeconds: number;
  rewardPointsPreview: number;
};

/**
 * Stage 2-C — server-authoritative min-view + ad_views attempt recording.
 * Never mutates point_ledger or campaign budget.
 */
export async function submitQuizAttempt(
  params: SubmitAttemptParams,
): Promise<QuizSubmitAttemptResult> {
  const minViewSeconds = resolveMinViewSeconds(params.minViewSeconds);
  const { campaignId, quizId, selectedOption } = params;

  if (!campaignId || !quizId || !selectedOption.trim()) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "invalid",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds: null,
        attemptNo: null,
        attemptsRemaining: MAX_ATTEMPTS,
        nextAllowedAction: "입력값을 확인한 뒤 다시 시도해 주세요.",
      },
      false,
    );
  }

  if (!isFixtureCampaignId(campaignId) && (!UUID_RE.test(campaignId) || !UUID_RE.test(quizId))) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "invalid",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds: null,
        attemptNo: null,
        attemptsRemaining: MAX_ATTEMPTS,
        nextAllowedAction: "입력값을 확인한 뒤 다시 시도해 주세요.",
      },
      false,
    );
  }

  if (isFixtureCampaignId(campaignId)) {
    return submitFixtureAttempt(params, minViewSeconds);
  }

  if (!params.userId || !params.supabase) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "not_allowed",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds: null,
        attemptNo: null,
        attemptsRemaining: MAX_ATTEMPTS,
        nextAllowedAction: "퀴즈 제출을 위해 로그인이 필요합니다.",
      },
      false,
    );
  }

  return submitDbAttempt(params as SubmitAttemptParams & { supabase: SupabaseClient; userId: string }, minViewSeconds);
}

async function submitFixtureAttempt(
  params: SubmitAttemptParams,
  minViewSeconds: number,
): Promise<QuizSubmitAttemptResult> {
  const { rewardPointsPreview } = params;
  const state = await readFixtureViewState(params.campaignId);
  if (!state) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "not_allowed",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds: null,
        attemptNo: null,
        attemptsRemaining: MAX_ATTEMPTS,
        nextAllowedAction: "광고 열람을 시작한 뒤 퀴즈를 제출해 주세요.",
      },
      false,
    );
  }

  const { satisfied, serverElapsedSeconds } = assertServerMinViewSatisfied(
    state.viewStartedAtMs,
    minViewSeconds,
  );

  if (!satisfied) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "not_allowed",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: state.attemptNo,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - state.attemptNo),
        nextAllowedAction: "서버 기준 최소 열람 시간이 아직 충족되지 않았습니다.",
      },
      false,
    );
  }

  if (state.completed) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "already_completed",
        rewardPreviewAvailable: true,
        rewardPointsPreview: state.lastResult === "correct" ? params.rewardPointsPreview : null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: state.attemptNo,
        attemptsRemaining: 0,
        nextAllowedAction: "이미 완료된 퀴즈입니다.",
      },
      false,
    );
  }

  if (state.attemptLimitReached || state.attemptNo >= MAX_ATTEMPTS) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "attempt_limit_reached",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: state.attemptNo,
        attemptsRemaining: 0,
        nextAllowedAction:
          "오답입니다. 이번 광고의 리워드 미리보기는 종료되었습니다. 정답은 공개하지 않습니다.",
      },
      false,
    );
  }

  const answerMatched = gradeFixtureQuizAnswer(params.campaignId, params.selectedOption);
  if (answerMatched === null) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "invalid",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: state.attemptNo,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - state.attemptNo),
        nextAllowedAction: "퀴즈 제출을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      },
      false,
    );
  }

  const nextAttemptNo = state.attemptNo + 1;
  const nextState: FixtureViewState = {
    ...state,
    attemptNo: nextAttemptNo,
    lastResult: answerMatched ? "correct" : "incorrect",
    completed: answerMatched,
    attemptLimitReached: !answerMatched && nextAttemptNo >= MAX_ATTEMPTS,
  };
  await updateFixtureViewState(params.campaignId, nextState);

  if (answerMatched) {
    return buildAttemptResult(
      {
        accepted: true,
        result: "correct",
        rewardPreviewAvailable: true,
        rewardPointsPreview,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: nextAttemptNo,
        attemptsRemaining: 0,
        nextAllowedAction:
          "정답입니다. 리워드 미리보기 대상입니다. 실제 포인트 적립은 다음 단계에서 처리됩니다.",
      },
      false,
    );
  }

  if (nextState.attemptLimitReached) {
    return buildAttemptResult(
      {
        accepted: true,
        result: "incorrect",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: nextAttemptNo,
        attemptsRemaining: 0,
        nextAllowedAction:
          "오답입니다. 이번 광고의 리워드 미리보기는 종료되었습니다. 정답은 공개하지 않습니다.",
      },
      false,
    );
  }

  return buildAttemptResult(
    {
      accepted: true,
      result: "incorrect",
      rewardPreviewAvailable: false,
      rewardPointsPreview: null,
      minViewRequiredSeconds: minViewSeconds,
      serverElapsedSeconds,
      attemptNo: nextAttemptNo,
      attemptsRemaining: MAX_ATTEMPTS - nextAttemptNo,
      nextAllowedAction: "오답입니다. 한 번 더 도전할 수 있습니다. 정답은 공개하지 않습니다.",
    },
    false,
  );
}

async function submitDbAttempt(
  params: SubmitAttemptParams & { supabase: SupabaseClient; userId: string },
  minViewSeconds: number,
): Promise<QuizSubmitAttemptResult> {
  const { supabase, userId, campaignId, quizId, selectedOption, rewardPointsPreview } = params;

  const row = await findTodayAdView(supabase, userId, campaignId);
  if (!row) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "not_allowed",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds: null,
        attemptNo: null,
        attemptsRemaining: MAX_ATTEMPTS,
        nextAllowedAction: "광고 열람을 시작한 뒤 퀴즈를 제출해 주세요.",
      },
      false,
    );
  }

  const attemptState = mapDbRow(row);
  const { satisfied, serverElapsedSeconds } = assertServerMinViewSatisfied(
    attemptState.viewStartedAtMs,
    minViewSeconds,
  );

  if (!satisfied) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "not_allowed",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: row.attempt_no,
        attemptsRemaining: attemptState.attemptsRemaining,
        nextAllowedAction: "서버 기준 최소 열람 시간이 아직 충족되지 않았습니다.",
      },
      true,
    );
  }

  if (attemptState.completed) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "already_completed",
        rewardPreviewAvailable: true,
        rewardPointsPreview: attemptState.lastResult === "correct" ? rewardPointsPreview : null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: row.attempt_no,
        attemptsRemaining: 0,
        nextAllowedAction: "이미 완료된 퀴즈입니다.",
      },
      true,
    );
  }

  if (attemptState.attemptLimitReached || row.attempt_no >= MAX_ATTEMPTS) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "attempt_limit_reached",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: row.attempt_no,
        attemptsRemaining: 0,
        nextAllowedAction:
          "오답입니다. 이번 광고의 리워드 미리보기는 종료되었습니다. 정답은 공개하지 않습니다.",
      },
      true,
    );
  }

  const rpcResult = await gradeViaRpc(supabase, quizId, selectedOption);
  if (rpcResult === "rpc_error") {
    return buildAttemptResult(
      {
        accepted: false,
        result: "invalid",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: row.attempt_no,
        attemptsRemaining: attemptState.attemptsRemaining,
        nextAllowedAction: "퀴즈 제출을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      },
      true,
    );
  }

  const nextAttemptNo = row.attempt_no + 1;
  const answerMatched = rpcResult;
  const nextStatus = answerMatched
    ? ("quiz_submitted" as const)
    : nextAttemptNo >= MAX_ATTEMPTS
      ? ("failed" as const)
      : ("viewed" as const);

  const { error: updateError } = await supabase
    .from("ad_views")
    .update({
      attempt_no: nextAttemptNo,
      status: nextStatus,
      quiz_id: quizId,
      points_earned: 0,
    })
    .eq("id", row.id)
    .eq("consumer_user_id", userId);

  if (updateError) {
    return buildAttemptResult(
      {
        accepted: false,
        result: "invalid",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: row.attempt_no,
        attemptsRemaining: attemptState.attemptsRemaining,
        nextAllowedAction: "퀴즈 제출을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      },
      true,
    );
  }

  if (answerMatched) {
    return buildAttemptResult(
      {
        accepted: true,
        result: "correct",
        rewardPreviewAvailable: true,
        rewardPointsPreview,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: nextAttemptNo,
        attemptsRemaining: 0,
        nextAllowedAction:
          "정답입니다. 리워드 미리보기 대상입니다. 실제 포인트 적립은 다음 단계에서 처리됩니다.",
      },
      true,
    );
  }

  if (nextAttemptNo >= MAX_ATTEMPTS) {
    return buildAttemptResult(
      {
        accepted: true,
        result: "incorrect",
        rewardPreviewAvailable: false,
        rewardPointsPreview: null,
        minViewRequiredSeconds: minViewSeconds,
        serverElapsedSeconds,
        attemptNo: nextAttemptNo,
        attemptsRemaining: 0,
        nextAllowedAction:
          "오답입니다. 이번 광고의 리워드 미리보기는 종료되었습니다. 정답은 공개하지 않습니다.",
      },
      true,
    );
  }

  return buildAttemptResult(
    {
      accepted: true,
      result: "incorrect",
      rewardPreviewAvailable: false,
      rewardPointsPreview: null,
      minViewRequiredSeconds: minViewSeconds,
      serverElapsedSeconds,
      attemptNo: nextAttemptNo,
      attemptsRemaining: MAX_ATTEMPTS - nextAttemptNo,
      nextAllowedAction: "오답입니다. 한 번 더 도전할 수 있습니다. 정답은 공개하지 않습니다.",
    },
    true,
  );
}
