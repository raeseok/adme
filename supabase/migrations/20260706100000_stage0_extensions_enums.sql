-- AdMe Stage 0: Extensions & Enums
-- 모든 금액·포인트는 BIGINT 원 단위 (1P = 1원)

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'consumer',
  'advertiser',
  'partner',
  'admin'
);

CREATE TYPE public.campaign_status AS ENUM (
  'draft',
  'pending_review',
  'active',
  'paused',
  'completed',
  'cancelled'
);

CREATE TYPE public.ledger_entry_type AS ENUM (
  'ad_reward',           -- 소비자 광고 시청 보상
  'cash_redemption',     -- 현금 전환 차감
  'advertiser_prepay',   -- 광고주 선납 충전
  'campaign_spend',      -- 캠페인 예산 차감
  'partner_settlement',  -- 파트너 정산
  'admin_adjustment',    -- 관리자 수동 조정
  'revenue_allocation'   -- 수익 배분 (내부 풀 이동)
);

CREATE TYPE public.ledger_account_type AS ENUM (
  'consumer',
  'advertiser',
  'partner',
  'reward_pool',
  'adme_hq',
  'ops_pool',
  'buffer_pool',
  'system'
);

CREATE TYPE public.redemption_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'paid',
  'cancelled'
);

CREATE TYPE public.settlement_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'cancelled'
);

CREATE TYPE public.ad_view_status AS ENUM (
  'viewed',
  'quiz_submitted',
  'rewarded',
  'failed'
);

-- ---------------------------------------------------------------------------
-- Constants (비즈니스 규칙)
-- ---------------------------------------------------------------------------

COMMENT ON TYPE public.ledger_entry_type IS 'point_ledger 거래 유형 — 단일 진실 원천';

-- 현금 전환 최소 기준: 10,000P (= 10,000원)
CREATE OR REPLACE FUNCTION public.min_cash_redemption_points()
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT 10000::BIGINT;
$$;

-- 광고비 100원 기준 수익 배분 (원 단위, BIGINT)
CREATE OR REPLACE FUNCTION public.revenue_split_per_100_won()
RETURNS TABLE (
  reward_pool BIGINT,
  partner_share BIGINT,
  adme_hq BIGINT,
  ops_pool BIGINT,
  buffer_pool BIGINT
)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    35::BIGINT AS reward_pool,
    30::BIGINT AS partner_share,
    20::BIGINT AS adme_hq,
    10::BIGINT AS ops_pool,
    5::BIGINT AS buffer_pool;
$$;
