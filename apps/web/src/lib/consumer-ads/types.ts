/** Stage 2-A read-only consumer ad card DTO — no answer fields. */
export type QuizOptionDto = {
  optionId: string;
  label: string;
};

export type ConsumerAdCardDto = {
  campaignId: string;
  quizId: string;
  title: string;
  advertiserDisplayName: string;
  categoryLabel: string;
  regionLabel: string;
  bodyExcerpt: string;
  pointPreviewLabel: string;
  rewardPointsPreview: number;
  minViewSecondsPreview: number;
  quizQuestion: string;
  quizOptions: QuizOptionDto[];
  readOnlyMode: true;
};

export type QuizSubmitPreviewInput = {
  campaignId: string;
  quizId: string;
  selectedOption: string;
  clientElapsedMs: number;
};

export type QuizPreviewResultKind = "correct" | "incorrect" | "not_allowed" | "invalid";

export type QuizAttemptResultKind =
  | "correct"
  | "incorrect"
  | "not_allowed"
  | "already_completed"
  | "attempt_limit_reached"
  | "invalid";

export type RewardPreview = {
  rewardPreviewOnly: true;
  rewardPointsPreview: number | null;
};

export type QuizSubmitPreviewResult = {
  accepted: boolean;
  result: QuizPreviewResultKind;
  rewardPreviewOnly: true;
  rewardPointsPreview: number | null;
  pointLedgerMutation: false;
  adViewsMutation: false;
  quizAnswerExposed: false;
  minViewRequiredSeconds: number;
  minViewClientSatisfied: boolean;
  serverAuthoritativeMinView: false;
  nextAllowedAction: string;
};

export type QuizSubmitAttemptInput = {
  campaignId: string;
  quizId: string;
  selectedOption: string;
};

export type BeginAdViewActionResult = {
  started: boolean;
  serverAuthoritativeMinView: true;
  adViewsMutation: boolean;
  viewStartedAtMs: number | null;
  attemptsRemaining: number;
};

export type QuizSubmitAttemptResult = {
  accepted: boolean;
  result: QuizAttemptResultKind;
  rewardPreviewOnly: true;
  rewardPreviewAvailable: boolean;
  rewardPointsPreview: number | null;
  pointLedgerMutation: false;
  adViewsMutation: boolean;
  quizAnswerExposed: false;
  minViewRequiredSeconds: number;
  serverAuthoritativeMinView: true;
  serverElapsedSeconds: number | null;
  attemptNo: number | null;
  attemptsRemaining: number;
  nextAllowedAction: string;
};

export type ConsumerAdsPageData = {
  cards: ConsumerAdCardDto[];
  dataSource: "database" | "fixture";
};
