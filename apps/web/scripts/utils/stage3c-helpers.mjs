/**
 * Stage 3-C shared verify helpers
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const ANSWER_HINT_TOKENS = [
  "정답",
  "정답은",
  "correct",
  "answer",
  "solution",
  "right answer",
  "맞는 답",
  "오답 아님",
  "정답 후보",
  "correctindex",
  "answerindex",
  "correctoption",
];

export const FORBIDDEN_ANSWER_KEYS = [
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
];

export const STAGE3C_PUBLIC_FORBIDDEN_MARKERS = [
  "stage3CConsumerQuizSubmitUi=",
  "stage3CControlledIntegration=",
  "stage3CServerActionOrRouteHandler=",
  "stage3CRpcName=",
  "stage3CClientDirectRpcCall=",
  "stage3CProductionRewardBlocked=",
  "stage3CProductionPointLedgerMutation=",
  "stage3CQuizAnswerExposure=",
  "stage3CPublicMarkerExposed=",
];

export function assertNoForbiddenKeys(text, label) {
  for (const key of FORBIDDEN_ANSWER_KEYS) {
    if (text.includes(key)) {
      throw new Error(`${label} exposes forbidden key: ${key}`);
    }
  }
}

export function assertNoAnswerHintInLabel(label, context) {
  const lower = label.toLowerCase();
  for (const token of ANSWER_HINT_TOKENS) {
    if (lower.includes(token.toLowerCase())) {
      throw new Error(`${context} answer-hint token "${token}" in label: ${label}`);
    }
  }
}

export function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(full, acc);
    } else if (/\.(tsx|ts|jsx|js|mjs)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function isClientComponentFile(path, source) {
  return (
    path.includes(`${join("src", "components")}`) ||
    (path.includes(join("src", "app")) && source.includes('"use client"'))
  );
}
