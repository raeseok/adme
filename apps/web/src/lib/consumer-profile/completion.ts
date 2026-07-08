import { isValidBirthYear } from "./constants";

export type InterestScope = "selected" | "all";

export type ProfileCompletionInput = {
  birthYear: number | null;
  gender: string | null;
  residenceRegionId: string;
  savableRegionIds: ReadonlySet<string>;
  interestScope: InterestScope;
  categoryIds: string[];
  oldestChildBirthYear?: number | null;
  youngestChildBirthYear?: number | null;
  petTypes?: readonly string[] | null;
  activitySlot1RegionId?: string;
  activitySlot2RegionId?: string;
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
  basicCompletedCount: number;
  basicTotalCount: 3;
  basicRemainingLabels: string[];
  optionalAvailableLabels: string[];
  axes: ProfileCompletionAxis;
};

const BASIC_LABELS = {
  age: "출생년도",
  gender: "성별",
  region: "주거지역",
} as const;

const AXIS_LABELS: Record<keyof ProfileCompletionAxis, string> = {
  age: BASIC_LABELS.age,
  gender: BASIC_LABELS.gender,
  region: BASIC_LABELS.region,
  interest: "관심정보",
};

export function computeProfileCompletion(
  input: ProfileCompletionInput,
): ProfileCompletionResult {
  const basicAxes = {
    age: isValidBirthYear(input.birthYear),
    gender: input.gender !== null && input.gender.length > 0,
    region:
      input.residenceRegionId.length > 0 &&
      input.savableRegionIds.has(input.residenceRegionId),
  };

  const interestDone =
    input.interestScope === "all" ||
    (input.interestScope === "selected" && input.categoryIds.length >= 1);

  const axes: ProfileCompletionAxis = {
    ...basicAxes,
    interest: interestDone,
  };

  const completedCount = Object.values(axes).filter(Boolean).length;
  const percent = (completedCount * 25) as 0 | 25 | 50 | 75 | 100;

  const basicCompletedCount = Object.values(basicAxes).filter(Boolean).length;
  const basicRemainingLabels = (
    Object.entries(basicAxes) as [keyof typeof basicAxes, boolean][]
  )
    .filter(([, done]) => !done)
    .map(([key]) => BASIC_LABELS[key]);

  const optionalAvailableLabels: string[] = [];
  if (input.oldestChildBirthYear == null && input.youngestChildBirthYear == null) {
    optionalAvailableLabels.push("자녀 생년");
  }
  if (!input.petTypes || input.petTypes.length === 0) {
    optionalAvailableLabels.push("반려동물 조건");
  }
  if (!input.activitySlot1RegionId) {
    optionalAvailableLabels.push("주활동지역");
  }
  if (!interestDone) {
    optionalAvailableLabels.push("관심정보");
  }

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
    basicCompletedCount,
    basicTotalCount: 3,
    basicRemainingLabels,
    optionalAvailableLabels,
    axes,
  };
}
