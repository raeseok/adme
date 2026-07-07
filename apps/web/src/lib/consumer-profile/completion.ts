import { isValidBirthYear } from "./constants";

export type InterestScope = "selected" | "all";

export type ProfileCompletionInput = {
  birthYear: number | null;
  gender: string | null;
  residenceRegionId: string;
  validRegionIds: ReadonlySet<string>;
  interestScope: InterestScope;
  categoryIds: string[];
};

export type ProfileCompletionAxis = {
  age: boolean;
  gender: boolean;
  region: boolean;
  interest: boolean;
};

export type ProfileCompletionResult = {
  percent: 0 | 25 | 50 | 75 | 100;
  completedCount: number;
  totalCount: 4;
  remainingLabels: string[];
  axes: ProfileCompletionAxis;
};

const AXIS_LABELS: Record<keyof ProfileCompletionAxis, string> = {
  age: "출생년도",
  gender: "성별",
  region: "주거지역",
  interest: "관심정보",
};

export function computeProfileCompletion(
  input: ProfileCompletionInput,
): ProfileCompletionResult {
  const axes: ProfileCompletionAxis = {
    age: isValidBirthYear(input.birthYear),
    gender: input.gender !== null && input.gender.length > 0,
    region:
      input.residenceRegionId.length > 0 &&
      input.validRegionIds.has(input.residenceRegionId),
    interest:
      input.interestScope === "all" ||
      (input.interestScope === "selected" && input.categoryIds.length >= 1),
  };

  const completedCount = Object.values(axes).filter(Boolean).length;
  const percent = (completedCount * 25) as 0 | 25 | 50 | 75 | 100;

  const remainingLabels = (
    Object.entries(axes) as [keyof ProfileCompletionAxis, boolean][]
  )
    .filter(([, done]) => !done)
    .map(([key]) => AXIS_LABELS[key]);

  return {
    percent,
    completedCount,
    totalCount: 4,
    remainingLabels,
    axes,
  };
}
