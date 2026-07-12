export type Stage4ACampaignStatus =
  | "draft"
  | "ready_for_preview"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "active"
  | "completed"
  | "rejected";

export type Stage4AGenderTarget = "all" | "male" | "female" | "undisclosed";

export type AdCreativeType = "text" | "image" | "video";

export type AdQuizType = "multiple_choice" | "short_answer";

export type AdCreativePublic = {
  type: AdCreativeType;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  videoCaption?: string;
  linkEnabled: boolean;
  landingUrl?: string;
  landingHostname?: string;
  ctaLabel?: string;
  openInNewTab: boolean;
  externalLinkNotice: string;
};

export type AdvertiserQuizPublic = {
  type: AdQuizType;
  question: string;
  options?: string[];
  answerRegistered: boolean;
  acceptedAnswerCount?: number;
};

export type AdvertiserQuizAuthoringSecret = {
  multipleChoiceSelection?: number | null;
  shortAnswer?: string;
  acceptedAnswers?: string[];
};

export type Stage4ACampaign = {
  id: string;
  name: string;
  advertiserName: string;
  adTitle: string;
  description: string;
  category: string;
  targetRegions: string[];
  interestCategories: string[];
  genderTarget: Stage4AGenderTarget;
  birthYearRange: {
    from: number;
    to: number;
  };
  exposureDays: string[];
  exposureTime: {
    start: string;
    end: string;
  };
  creativeLabel: string;
  creative: AdCreativePublic;
  minViewSeconds: number;
  quizType: AdQuizType;
  quizQuestion: string;
  quizOptions: string[];
  quiz: AdvertiserQuizPublic;
  answerRegistered: boolean;
  acceptedAnswerCount?: number;
  pointPerPass: number;
  demoBudgetPoints: number;
  estimatedReach: number;
  estimatedVerifiedEngagements: number;
  startsAt: string;
  endsAt: string;
  status: Stage4ACampaignStatus;
  metrics: {
    matchedConsumers: number;
    adOpens: number;
    verifiedViews: number;
    quizAttempts: number;
    quizPasses: number;
    pointPerPass: number;
    demoPointSpend: number;
    remainingDemoBudget: number;
  };
};

export type Stage4ADemoEvent = {
  id: string;
  campaignId: string;
  label: string;
  status: Stage4ACampaignStatus;
};

export type Stage4ADemoStore = {
  schemaVersion: 1;
  statusByCampaignId: Record<string, Stage4ACampaignStatus>;
  eventsByCampaignId: Record<string, Stage4ADemoEvent[]>;
  resetVersion: number;
  submittedCampaignId: string | null;
};

export type Stage4ABudgetEstimate = {
  maximumRewardedEngagements: number;
  estimatedPointSpend: number;
  estimatedRemainingBudget: number;
};
