-- AdMe Stage 0: Core Tables
-- 잔액 컬럼(point_balance, prepay_balance 등)은 조회 성능용 캐시이며
-- point_ledger 합계와 대조 가능해야 한다.

-- ---------------------------------------------------------------------------
-- updated_at 트리거 함수 (공통)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles — auth.users 확장, 역할 기반 사용자
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  point_balance BIGINT NOT NULL DEFAULT 0 CHECK (point_balance >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.profiles IS 'Supabase Auth 사용자 프로필 — consumer/advertiser/partner/admin';
COMMENT ON COLUMN public.profiles.point_balance IS '캐시: point_ledger consumer 계정 합계와 대조';

-- ---------------------------------------------------------------------------
-- regions — 지역 (파트너 담당 지역 매핑)
-- ---------------------------------------------------------------------------

CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER regions_set_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- interest_categories — 관심/소비 카테고리
-- ---------------------------------------------------------------------------

CREATE TABLE public.interest_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.interest_categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER interest_categories_set_updated_at
  BEFORE UPDATE ON public.interest_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- consumer_profiles — 소비 의향 프로필
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  monthly_intent_min BIGINT CHECK (monthly_intent_min IS NULL OR monthly_intent_min >= 0),
  monthly_intent_max BIGINT CHECK (monthly_intent_max IS NULL OR monthly_intent_max >= 0),
  birth_year INT CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2100)),
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumer_profiles_intent_range CHECK (
    monthly_intent_min IS NULL
    OR monthly_intent_max IS NULL
    OR monthly_intent_min <= monthly_intent_max
  )
);

CREATE TRIGGER consumer_profiles_set_updated_at
  BEFORE UPDATE ON public.consumer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- consumer_category_interests — 소비자 ↔ 관심 카테고리 (M:N)
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_category_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_profile_id UUID NOT NULL REFERENCES public.consumer_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.interest_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (consumer_profile_id, category_id)
);

-- ---------------------------------------------------------------------------
-- advertisers — 광고주
-- ---------------------------------------------------------------------------

CREATE TABLE public.advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_registration_number TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  prepay_balance BIGINT NOT NULL DEFAULT 0 CHECK (prepay_balance >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER advertisers_set_updated_at
  BEFORE UPDATE ON public.advertisers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON COLUMN public.advertisers.prepay_balance IS '캐시: point_ledger advertiser 계정 합계와 대조';

-- ---------------------------------------------------------------------------
-- advertiser_prepayments — 광고주 선납 기록 (관리자 수동 충전)
-- ---------------------------------------------------------------------------

CREATE TABLE public.advertiser_prepayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  note TEXT,
  ledger_entry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- partners — 지역 제휴 파트너
-- ---------------------------------------------------------------------------

CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  contact_name TEXT,
  contact_phone TEXT,
  settlement_balance BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER partners_set_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- partner_settlements — 파트너 정산 (관리자 수동)
-- ---------------------------------------------------------------------------

CREATE TABLE public.partner_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status public.settlement_status NOT NULL DEFAULT 'pending',
  admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  note TEXT,
  ledger_entry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT partner_settlements_period CHECK (period_start <= period_end)
);

CREATE TRIGGER partner_settlements_set_updated_at
  BEFORE UPDATE ON public.partner_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- campaigns — 광고주 캠페인
-- ---------------------------------------------------------------------------

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  category_id UUID NOT NULL REFERENCES public.interest_categories(id),
  ad_content_url TEXT,
  ad_content_text TEXT,
  budget_total BIGINT NOT NULL CHECK (budget_total > 0),
  budget_spent BIGINT NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
  reward_per_view BIGINT NOT NULL CHECK (reward_per_view > 0),
  max_views_per_consumer INT NOT NULL DEFAULT 1 CHECK (max_views_per_consumer >= 1),
  status public.campaign_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_budget CHECK (budget_spent <= budget_total),
  CONSTRAINT campaigns_schedule CHECK (
    starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at
  )
);

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quizzes — 캠페인 퀴즈
-- quiz_answer 컬럼은 클라이언트에 노출 금지 (별도 RLS/뷰로 방어)
-- ---------------------------------------------------------------------------

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::JSONB,
  quiz_answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quizzes_options_is_array CHECK (jsonb_typeof(options) = 'array')
);

CREATE TRIGGER quizzes_set_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.quizzes IS 'quiz_answer는 RLS/뷰로 클라이언트 노출 금지';

-- ---------------------------------------------------------------------------
-- ad_views — 광고 열람 기록
-- ---------------------------------------------------------------------------

CREATE TABLE public.ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  status public.ad_view_status NOT NULL DEFAULT 'viewed',
  points_earned BIGINT NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- point_ledger — 모든 포인트 거래의 단일 진실 원천 (SSOT)
-- ---------------------------------------------------------------------------

CREATE TABLE public.point_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type public.ledger_account_type NOT NULL,
  account_id UUID,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entry_type public.ledger_entry_type NOT NULL,
  amount BIGINT NOT NULL CHECK (amount != 0),
  balance_after BIGINT,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.point_ledger IS '모든 포인트 거래 SSOT — 잔액 캐시는 profiles/advertisers에서 별도 관리';

-- ---------------------------------------------------------------------------
-- cash_redemption_requests — 소비자 현금 전환 요청 (최소 10,000P)
-- ---------------------------------------------------------------------------

CREATE TABLE public.cash_redemption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount >= public.min_cash_redemption_points()),
  status public.redemption_status NOT NULL DEFAULT 'pending',
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_note TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  ledger_entry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER cash_redemption_requests_set_updated_at
  BEFORE UPDATE ON public.cash_redemption_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- system_pool_balances — 내부 수익 풀 잔액 캐시 (reward/adme/ops/buffer)
-- ---------------------------------------------------------------------------

CREATE TABLE public.system_pool_balances (
  pool_type public.ledger_account_type PRIMARY KEY,
  balance BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT system_pool_balances_valid_type CHECK (
    pool_type IN ('reward_pool', 'adme_hq', 'ops_pool', 'buffer_pool')
  )
);

-- ---------------------------------------------------------------------------
-- Deferred FK: ledger_entry_id 참조
-- ---------------------------------------------------------------------------

ALTER TABLE public.advertiser_prepayments
  ADD CONSTRAINT advertiser_prepayments_ledger_entry_id_fkey
  FOREIGN KEY (ledger_entry_id) REFERENCES public.point_ledger(id) ON DELETE SET NULL;

ALTER TABLE public.partner_settlements
  ADD CONSTRAINT partner_settlements_ledger_entry_id_fkey
  FOREIGN KEY (ledger_entry_id) REFERENCES public.point_ledger(id) ON DELETE SET NULL;

ALTER TABLE public.cash_redemption_requests
  ADD CONSTRAINT cash_redemption_requests_ledger_entry_id_fkey
  FOREIGN KEY (ledger_entry_id) REFERENCES public.point_ledger(id) ON DELETE SET NULL;