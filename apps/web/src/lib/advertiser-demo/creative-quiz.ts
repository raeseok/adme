import {
  STAGE4A_DEMO_IMAGE_URL,
  STAGE4A_DEMO_POSTER_URL,
  STAGE4A_DEMO_VIDEO_URL,
  STAGE4A_EXTERNAL_LINK_NOTICE,
} from "./constants";
import type {
  AdCreativePublic,
  AdCreativeType,
  AdQuizType,
  AdvertiserQuizAuthoringSecret,
  AdvertiserQuizPublic,
  Stage4ACampaign,
} from "./types";

const BLOCKED_LANDING_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "file:",
  "blob:",
  "vbscript:",
  "about:",
]);

export type LandingUrlValidationResult =
  | { ok: true; url: string; hostname: string }
  | { ok: false; reason: string };

export function parseLandingUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed || /\s|[\u0000-\u001f\u007f]/u.test(trimmed)) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

export function isAllowedLandingProtocol(url: URL) {
  if (BLOCKED_LANDING_PROTOCOLS.has(url.protocol)) return false;
  if (url.protocol === "https:") return true;
  if (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  ) {
    return true;
  }
  return false;
}

export function validateLandingUrl(value: string): LandingUrlValidationResult {
  const parsed = parseLandingUrl(value);
  if (!parsed) return { ok: false, reason: "malformed_url" };
  if (!isAllowedLandingProtocol(parsed)) return { ok: false, reason: "blocked_protocol" };
  if (!parsed.hostname) return { ok: false, reason: "empty_hostname" };
  if (parsed.username || parsed.password) return { ok: false, reason: "credentials_blocked" };
  return {
    ok: true,
    url: parsed.toString(),
    hostname: parsed.hostname,
  };
}

export function getLandingHostname(value?: string) {
  if (!value) return "";
  const result = validateLandingUrl(value);
  return result.ok ? result.hostname : "";
}

export function sanitizeLandingUrlForPublicState(value: string) {
  const result = validateLandingUrl(value);
  return result.ok ? result.url : undefined;
}

export function normalizeShortAnswer(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

export function normalizeAcceptedAnswers(primary: string, acceptedAnswers: string[]) {
  return [...new Set([primary, ...acceptedAnswers].map(normalizeShortAnswer).filter(Boolean))].slice(
    0,
    5,
  );
}

export function compareShortAnswer(input: string, acceptedAnswers: string[]) {
  const normalizedInput = normalizeShortAnswer(input);
  return acceptedAnswers.map(normalizeShortAnswer).includes(normalizedInput);
}

export function validateMultipleChoiceQuiz(options: string[], selectedIndex: number | null) {
  const trimmed = options.map((option) => option.trim()).filter(Boolean);
  const unique = new Set(trimmed.map((option) => option.toLocaleLowerCase("ko-KR")));
  return {
    ok:
      trimmed.length >= 2 &&
      trimmed.length <= 4 &&
      unique.size === trimmed.length &&
      selectedIndex != null &&
      selectedIndex >= 0 &&
      selectedIndex < options.length &&
      Boolean(options[selectedIndex]?.trim()),
    optionCount: trimmed.length,
    duplicateOptions: unique.size !== trimmed.length,
  };
}

export function validateCreativeMedia(creative: AdCreativePublic) {
  if (creative.type === "text") return creative.title.trim().length >= 2 && creative.body.trim().length >= 10;
  if (creative.type === "image") return Boolean(creative.imageUrl && creative.imageAlt?.trim());
  if (creative.type === "video") return Boolean(creative.videoUrl && creative.videoCaption?.trim());
  return false;
}

export function createPublicCreative(input: {
  type: AdCreativeType;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  videoCaption?: string;
  linkEnabled: boolean;
  landingUrl: string;
  ctaLabel: string;
}): AdCreativePublic {
  const landingUrl = input.linkEnabled
    ? sanitizeLandingUrlForPublicState(input.landingUrl)
    : undefined;
  return {
    type: input.type,
    title: input.title,
    body: input.body,
    imageUrl: input.type === "image" ? input.imageUrl || STAGE4A_DEMO_IMAGE_URL : undefined,
    imageAlt: input.type === "image" ? input.imageAlt : undefined,
    videoUrl: input.type === "video" ? input.videoUrl || STAGE4A_DEMO_VIDEO_URL : undefined,
    videoPosterUrl:
      input.type === "video" ? input.videoPosterUrl || STAGE4A_DEMO_POSTER_URL : undefined,
    videoCaption: input.type === "video" ? input.videoCaption : undefined,
    linkEnabled: Boolean(input.linkEnabled && landingUrl),
    landingUrl,
    landingHostname: landingUrl ? getLandingHostname(landingUrl) : undefined,
    ctaLabel: input.linkEnabled ? input.ctaLabel.trim() : undefined,
    openInNewTab: true,
    externalLinkNotice: STAGE4A_EXTERNAL_LINK_NOTICE,
  };
}

export function createPublicQuiz(input: {
  type: AdQuizType;
  question: string;
  options: string[];
  authoringSecret: AdvertiserQuizAuthoringSecret;
}): AdvertiserQuizPublic {
  if (input.type === "short_answer") {
    const acceptedAnswerCount = normalizeAcceptedAnswers(
      input.authoringSecret.shortAnswer ?? "",
      input.authoringSecret.acceptedAnswers ?? [],
    ).length;
    return {
      type: "short_answer",
      question: input.question,
      answerRegistered: acceptedAnswerCount > 0,
      acceptedAnswerCount,
    };
  }
  return {
    type: "multiple_choice",
    question: input.question,
    options: input.options.map((option) => option.trim()).filter(Boolean).slice(0, 4),
    answerRegistered:
      validateMultipleChoiceQuiz(
        input.options,
        input.authoringSecret.multipleChoiceSelection ?? null,
      ).ok,
  };
}

export function sanitizeCampaignForPublicState(campaign: Stage4ACampaign): Stage4ACampaign {
  return {
    ...campaign,
    creative: {
      ...campaign.creative,
      landingUrl: campaign.creative.landingUrl
        ? sanitizeLandingUrlForPublicState(campaign.creative.landingUrl)
        : undefined,
    },
    quiz: {
      ...campaign.quiz,
      options: campaign.quiz.type === "multiple_choice" ? campaign.quiz.options ?? [] : undefined,
    },
    quizOptions: campaign.quiz.type === "multiple_choice" ? campaign.quizOptions : [],
  };
}

export function switchQuizType(
  nextType: AdQuizType,
): { quizType: AdQuizType; authoringSecret: AdvertiserQuizAuthoringSecret } {
  return {
    quizType: nextType,
    authoringSecret:
      nextType === "multiple_choice"
        ? { multipleChoiceSelection: null }
        : { shortAnswer: "", acceptedAnswers: [] },
  };
}

export function recordLandingClickDemoState(currentClicks: number) {
  return {
    ctaClickCount: currentClicks + 1,
    quizPassGranted: false,
    rewardGranted: false,
  };
}
