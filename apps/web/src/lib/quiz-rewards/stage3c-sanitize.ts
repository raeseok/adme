import "server-only";

import type { Stage3CResultCode } from "./stage3c-types";

const FORBIDDEN_RESPONSE_KEYS = [
  "quiz_answer",
  "correct_answer",
  "correctAnswer",
  "correctOption",
  "correct_option",
  "correctIndex",
  "correct_index",
  "answerIndex",
  "answer_index",
  "solution",
  "isCorrect",
  "is_correct",
  "rightAnswer",
  "right_answer",
] as const;

export type SanitizedStage3BRpcPayload = {
  resultCode: Stage3CResultCode;
  rewarded: boolean;
  rewardAmount: number | null;
  remainingAttempts: number | null;
  attemptNo: number | null;
  idempotencyReplay: boolean;
};

function coerceResultCode(raw: unknown): Stage3CResultCode {
  if (typeof raw === "string" && raw.startsWith("STAGE3")) {
    return raw as Stage3CResultCode;
  }
  return "STAGE3C_UNKNOWN_ERROR";
}

export function sanitizeStage3BRpcResponse(
  payload: Record<string, unknown> | null,
): SanitizedStage3BRpcPayload {
  const text = JSON.stringify(payload ?? {});
  for (const key of FORBIDDEN_RESPONSE_KEYS) {
    if (text.includes(key)) {
      throw new Error(`Stage 3-C RPC response exposes forbidden key: ${key}`);
    }
  }

  const resultCode = coerceResultCode(payload?.result_code);
  const rewarded = payload?.rewarded === true;
  const rewardAmount =
    typeof payload?.amount === "number"
      ? payload.amount
      : payload?.amount != null
        ? Number(payload.amount)
        : null;
  const remainingAttempts =
    typeof payload?.remaining_attempts === "number"
      ? payload.remaining_attempts
      : payload?.remaining_attempts != null
        ? Number(payload.remaining_attempts)
        : null;
  const attemptNo =
    typeof payload?.attempt_no === "number"
      ? payload.attempt_no
      : payload?.attempt_no != null
        ? Number(payload.attempt_no)
        : null;
  const idempotencyReplay =
    payload?.idempotency_status === "duplicate" ||
    resultCode === "STAGE3B_IDEMPOTENT_DUPLICATE";

  return {
    resultCode,
    rewarded,
    rewardAmount: Number.isFinite(rewardAmount) ? rewardAmount : null,
    remainingAttempts: Number.isFinite(remainingAttempts)
      ? remainingAttempts
      : null,
    attemptNo: Number.isFinite(attemptNo) ? attemptNo : null,
    idempotencyReplay,
  };
}

export function assertStage3CClientDtoSafe(dto: unknown): void {
  const text = JSON.stringify(dto ?? {});
  for (const key of FORBIDDEN_RESPONSE_KEYS) {
    if (text.includes(key)) {
      throw new Error(`Stage 3-C client DTO exposes forbidden key: ${key}`);
    }
  }
}
