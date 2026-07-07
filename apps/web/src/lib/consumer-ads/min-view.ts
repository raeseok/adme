/** Clamp min-view seconds for Stage 2-B client UX (3–15s, default 5). */
export function resolveMinViewSeconds(value: number | null | undefined): number {
  const DEFAULT = 5;
  if (value == null || !Number.isFinite(value) || value <= 0) return DEFAULT;
  if (value < 3) return 3;
  if (value > 15) return 15;
  return Math.round(value);
}

export type MinViewTimerState = {
  requiredSeconds: number;
  elapsedMs: number;
  remainingSeconds: number;
  completed: boolean;
};
