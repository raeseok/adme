-- AdMe Stage 0: Indexes

-- profiles
CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_profiles_is_active ON public.profiles (is_active) WHERE is_active = true;

-- regions
CREATE INDEX idx_regions_parent_id ON public.regions (parent_id);
CREATE INDEX idx_regions_active_sort ON public.regions (sort_order) WHERE is_active = true;

-- interest_categories
CREATE INDEX idx_interest_categories_parent_id ON public.interest_categories (parent_id);
CREATE INDEX idx_interest_categories_active_sort ON public.interest_categories (sort_order) WHERE is_active = true;

-- consumer_profiles
CREATE INDEX idx_consumer_profiles_region_id ON public.consumer_profiles (region_id);
CREATE INDEX idx_consumer_profiles_user_id ON public.consumer_profiles (user_id);

-- consumer_category_interests
CREATE INDEX idx_consumer_category_interests_category ON public.consumer_category_interests (category_id);

-- advertisers
CREATE INDEX idx_advertisers_user_id ON public.advertisers (user_id);

-- advertiser_prepayments
CREATE INDEX idx_advertiser_prepayments_advertiser ON public.advertiser_prepayments (advertiser_id, created_at DESC);

-- partners
CREATE INDEX idx_partners_region_id ON public.partners (region_id);
CREATE INDEX idx_partners_user_id ON public.partners (user_id);

-- partner_settlements
CREATE INDEX idx_partner_settlements_partner ON public.partner_settlements (partner_id, status);
CREATE INDEX idx_partner_settlements_period ON public.partner_settlements (period_start, period_end);

-- campaigns
CREATE INDEX idx_campaigns_advertiser_id ON public.campaigns (advertiser_id);
CREATE INDEX idx_campaigns_region_id ON public.campaigns (region_id);
CREATE INDEX idx_campaigns_category_id ON public.campaigns (category_id);
CREATE INDEX idx_campaigns_status ON public.campaigns (status);
CREATE INDEX idx_campaigns_active_matching ON public.campaigns (region_id, category_id, status)
  WHERE status = 'active';

-- quizzes
CREATE INDEX idx_quizzes_campaign_id ON public.quizzes (campaign_id, sort_order);

-- ad_views
CREATE INDEX idx_ad_views_consumer ON public.ad_views (consumer_user_id, viewed_at DESC);
CREATE INDEX idx_ad_views_campaign ON public.ad_views (campaign_id, viewed_at DESC);
CREATE UNIQUE INDEX idx_ad_views_consumer_campaign_day ON public.ad_views (
  consumer_user_id,
  campaign_id,
  ((viewed_at AT TIME ZONE 'UTC')::date)
);

-- point_ledger (SSOT 조회·대조 성능)
CREATE INDEX idx_point_ledger_user ON public.point_ledger (user_id, created_at DESC)
  WHERE account_type = 'consumer';
CREATE INDEX idx_point_ledger_account ON public.point_ledger (account_type, account_id, created_at DESC);
CREATE INDEX idx_point_ledger_entry_type ON public.point_ledger (entry_type, created_at DESC);
CREATE INDEX idx_point_ledger_reference ON public.point_ledger (reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- cash_redemption_requests
CREATE INDEX idx_cash_redemption_consumer ON public.cash_redemption_requests (consumer_user_id, created_at DESC);
CREATE INDEX idx_cash_redemption_status ON public.cash_redemption_requests (status);
