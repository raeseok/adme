/** Stage 2-A read-only consumer ad card DTO — no answer fields. */
export type QuizOptionDto = {
  optionId: string;
  label: string;
};

export type ConsumerAdCardDto = {
  campaignId: string;
  title: string;
  advertiserDisplayName: string;
  categoryLabel: string;
  regionLabel: string;
  bodyExcerpt: string;
  pointPreviewLabel: string;
  minViewSecondsPreview: number;
  quizQuestion: string;
  quizOptions: QuizOptionDto[];
  readOnlyMode: true;
};

export type ConsumerAdsPageData = {
  cards: ConsumerAdCardDto[];
  dataSource: "database" | "fixture";
};
