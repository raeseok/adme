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

export type ConsumerAdsPageData = {
  cards: ConsumerAdCardDto[];
  dataSource: "database" | "fixture";
};
