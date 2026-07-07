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

export const BIRTH_YEAR_MIN = 1900;

export function getBirthYearMax(): number {
  return new Date().getFullYear();
}

export function isValidBirthYear(value: number | null | undefined): boolean {
  if (value == null) return false;
  if (!Number.isInteger(value)) return false;
  return value >= BIRTH_YEAR_MIN && value <= getBirthYearMax();
}

export function parseBirthYearInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

export const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "undisclosed", label: "응답하지 않음" },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export function isGenderValue(value: string): value is GenderValue {
  return GENDER_OPTIONS.some((o) => o.value === value);
}

export const INTEREST_SCOPE_ALL = "all" as const;
export const INTEREST_SCOPE_SELECTED = "selected" as const;

export type InterestScopeValue =
  | typeof INTEREST_SCOPE_ALL
  | typeof INTEREST_SCOPE_SELECTED;

export function isInterestScopeValue(
  value: string,
): value is InterestScopeValue {
  return value === INTEREST_SCOPE_ALL || value === INTEREST_SCOPE_SELECTED;
}

export function buildBirthYearOptions(): number[] {
  const max = getBirthYearMax();
  const years: number[] = [];
  for (let y = max; y >= BIRTH_YEAR_MIN; y -= 1) {
    years.push(y);
  }
  return years;
}
