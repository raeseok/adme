import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsumerAdCardDto, ConsumerAdsPageData, QuizOptionDto } from "./types";
import { resolveMinViewSeconds } from "./min-view";
import { getStage2AFixtureAdCards } from "./stage2a-fixtures.server";

const CAMPAIGN_SELECT =
  "id, title, description, ad_content_text, reward_per_view, region_id, category_id, advertiser_id";

type CampaignRow = {
  id: string;
  title: string;
  description: string | null;
  ad_content_text: string | null;
  reward_per_view: number;
  region_id: string;
  category_id: string;
  advertiser_id: string;
};

type QuizPublicRow = {
  id: string;
  campaign_id: string;
  question_text: string;
  options: unknown;
  sort_order: number;
};

function excerpt(text: string | null | undefined, max = 160): string {
  const value = (text ?? "").trim();
  if (!value) return "광고 본문 미리보기";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function formatPointPreview(reward: number): string {
  return `예상 적립 ${reward}P (미리보기)`;
}

function parseQuizOptions(raw: unknown): QuizOptionDto[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    if (typeof item === "string") {
      return { optionId: `opt-${index}`, label: item };
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const label =
        typeof record.label === "string"
          ? record.label
          : typeof record.text === "string"
            ? record.text
            : `선택지 ${index + 1}`;
      const optionId =
        typeof record.id === "string"
          ? record.id
          : typeof record.optionId === "string"
            ? record.optionId
            : `opt-${index}`;
      return { optionId, label };
    }
    return { optionId: `opt-${index}`, label: `선택지 ${index + 1}` };
  });
}

async function loadLabelMaps(
  supabase: SupabaseClient,
  regionIds: string[],
  categoryIds: string[],
  advertiserIds: string[],
) {
  const [regions, categories, advertisers] = await Promise.all([
    regionIds.length
      ? supabase.from("regions").select("id, name").in("id", regionIds)
      : Promise.resolve({ data: [], error: null }),
    categoryIds.length
      ? supabase.from("interest_categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    advertiserIds.length
      ? supabase.from("advertisers").select("id, company_name").in("id", advertiserIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const regionMap = new Map(
    (regions.data ?? []).map((r) => [r.id as string, r.name as string]),
  );
  const categoryMap = new Map(
    (categories.data ?? []).map((c) => [c.id as string, c.name as string]),
  );
  const advertiserMap = new Map(
    (advertisers.data ?? []).map((a) => [a.id as string, a.company_name as string]),
  );

  return { regionMap, categoryMap, advertiserMap };
}

function mapCampaignToCard(
  campaign: CampaignRow,
  quiz: QuizPublicRow | undefined,
  labels: {
    regionMap: Map<string, string>;
    categoryMap: Map<string, string>;
    advertiserMap: Map<string, string>;
  },
): ConsumerAdCardDto | null {
  if (!quiz) return null;

  return {
    campaignId: campaign.id,
    quizId: quiz.id,
    title: campaign.title,
    advertiserDisplayName:
      labels.advertiserMap.get(campaign.advertiser_id) ?? "광고주",
    categoryLabel: labels.categoryMap.get(campaign.category_id) ?? "관심 분야",
    regionLabel: labels.regionMap.get(campaign.region_id) ?? "지역",
    bodyExcerpt: excerpt(campaign.ad_content_text ?? campaign.description),
    creativeType: "text",
    creativeTitle: campaign.title,
    creativeBody: excerpt(campaign.ad_content_text ?? campaign.description, 1200),
    linkEnabled: false,
    pointPreviewLabel: formatPointPreview(campaign.reward_per_view),
    rewardPointsPreview: campaign.reward_per_view,
    minViewSecondsPreview: resolveMinViewSeconds(null),
    quizType: "multiple_choice",
    quizQuestion: quiz.question_text,
    quizOptions: parseQuizOptions(quiz.options),
    answerRegistered: true,
    readOnlyMode: true,
  };
}

export async function fetchConsumerAdCards(
  supabase: SupabaseClient | null,
): Promise<ConsumerAdsPageData> {
  if (!supabase) {
    return { cards: getStage2AFixtureAdCards(), dataSource: "fixture" };
  }

  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  if (campaignError || !campaigns?.length) {
    return { cards: getStage2AFixtureAdCards(), dataSource: "fixture" };
  }

  const campaignRows = campaigns as CampaignRow[];
  const campaignIds = campaignRows.map((c) => c.id);

  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes_public")
    .select("id, campaign_id, question_text, options, sort_order")
    .in("campaign_id", campaignIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (quizError) {
    return { cards: getStage2AFixtureAdCards(), dataSource: "fixture" };
  }

  const quizByCampaign = new Map<string, QuizPublicRow>();
  for (const quiz of (quizzes ?? []) as QuizPublicRow[]) {
    if (!quizByCampaign.has(quiz.campaign_id)) {
      quizByCampaign.set(quiz.campaign_id, quiz);
    }
  }

  const labels = await loadLabelMaps(
    supabase,
    [...new Set(campaignRows.map((c) => c.region_id))],
    [...new Set(campaignRows.map((c) => c.category_id))],
    [...new Set(campaignRows.map((c) => c.advertiser_id))],
  );

  const cards = campaignRows
    .map((campaign) =>
      mapCampaignToCard(campaign, quizByCampaign.get(campaign.id), labels),
    )
    .filter((card): card is ConsumerAdCardDto => card != null);

  if (!cards.length) {
    return { cards: getStage2AFixtureAdCards(), dataSource: "fixture" };
  }

  return { cards: [...cards, ...getStage2AFixtureAdCards()], dataSource: "database" };
}
