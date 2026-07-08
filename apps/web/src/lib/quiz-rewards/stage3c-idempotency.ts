import "server-only";

import { buildStage3BIdempotencyKey } from "@/lib/stage3/stage3b-full-transaction";

export function buildStage3CIdempotencyKey(params: {
  userId: string;
  adViewId: string;
  campaignId: string;
  quizId: string;
}): string {
  return buildStage3BIdempotencyKey(params);
}

/** Safe prefix for logs — never log full idempotency keys. */
export function maskIdempotencyKeyForLog(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 8)}…`;
}
