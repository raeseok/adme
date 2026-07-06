export const SPEND_RANGE_OPTIONS = [
  { value: "under_10k", label: "1만 원 미만", min: 0, max: 9_999 },
  { value: "10k_range", label: "1만 원대", min: 10_000, max: 19_999 },
  { value: "50k_range", label: "5만 원대", min: 50_000, max: 59_999 },
  { value: "100k_plus", label: "10만 원 이상", min: 100_000, max: null },
] as const;

export type SpendRangeValue = (typeof SPEND_RANGE_OPTIONS)[number]["value"];

export function isSpendRangeValue(value: string): value is SpendRangeValue {
  return SPEND_RANGE_OPTIONS.some((o) => o.value === value);
}

export function spendRangeToIntent(value: SpendRangeValue): {
  monthly_intent_min: number;
  monthly_intent_max: number | null;
} {
  const option = SPEND_RANGE_OPTIONS.find((o) => o.value === value)!;
  return { monthly_intent_min: option.min, monthly_intent_max: option.max };
}

export function intentToSpendRange(
  min: number | null,
  max: number | null,
): string {
  if (min == null && max == null) return "";
  const match = SPEND_RANGE_OPTIONS.find(
    (o) => o.min === min && o.max === max,
  );
  return match?.value ?? "";
}
