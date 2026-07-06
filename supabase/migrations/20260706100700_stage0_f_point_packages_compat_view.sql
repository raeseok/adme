-- AdMe Stage 0-F: point_packages compatibility VIEW (선택지 B)
-- 기준 문서 point_packages = advertiser_prepayments(실테이블) + point_packages(VIEW)
-- 쓰기는 record_advertiser_prepayment() RPC만 허용 — 이중 원장 방지

-- ---------------------------------------------------------------------------
-- point_packages VIEW — 배분 컬럼은 calculate_revenue_split()에서 파생
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.point_packages
WITH (security_invoker = true)
AS
SELECT
  ap.id,
  ap.advertiser_id,
  ap.amount,
  s.reward_pool AS reward_pool_amount,
  s.partner_share AS partner_share_amount,
  s.adme_hq AS adme_share_amount,
  s.ops_pool AS operation_reserve_amount,
  s.buffer_pool AS buffer_amount,
  ap.created_at AS paid_at,
  false AS refunded,
  0::BIGINT AS refund_amount,
  ap.note AS memo,
  ap.admin_user_id AS created_by,
  ap.created_at
FROM public.advertiser_prepayments ap
CROSS JOIN LATERAL public.calculate_revenue_split(ap.amount) AS s;

COMMENT ON VIEW public.point_packages IS
  '개발계획서 point_packages 호환 VIEW. 실데이터는 advertiser_prepayments. INSERT/UPDATE/DELETE 금지 — record_advertiser_prepayment() 사용';

GRANT SELECT ON public.point_packages TO authenticated;

-- ---------------------------------------------------------------------------
-- advertiser_prepayments — partner 관할 광고주 선납 조회 (point_packages 경로)
-- ---------------------------------------------------------------------------

CREATE POLICY advertiser_prepayments_partner_select ON public.advertiser_prepayments
  FOR SELECT TO authenticated
  USING (
    public.is_partner()
    AND advertiser_id IN (
      SELECT c.advertiser_id
      FROM public.campaigns c
      JOIN public.partners p ON p.region_id = c.region_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- record_advertiser_prepayment — reference_type을 point_packages로 정합화
-- (VIEW이므로 실INSERT는 advertiser_prepayments + point_ledger만)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_advertiser_prepayment(
  p_advertiser_id UUID,
  p_amount BIGINT,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prepay_id UUID;
  v_ledger_id UUID;
  v_new_balance BIGINT;
  v_split RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  SELECT * INTO v_split FROM public.calculate_revenue_split(p_amount);

  IF v_split.reward_pool + v_split.partner_share + v_split.adme_hq
     + v_split.ops_pool + v_split.buffer_pool != p_amount THEN
    RAISE EXCEPTION 'revenue split sum must equal amount';
  END IF;

  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_new_balance
  FROM public.point_ledger
  WHERE account_type = 'advertiser' AND account_id = p_advertiser_id;

  INSERT INTO public.advertiser_prepayments (
    advertiser_id, amount, admin_user_id, note
  )
  VALUES (p_advertiser_id, p_amount, auth.uid(), p_note)
  RETURNING id INTO v_prepay_id;

  INSERT INTO public.point_ledger (
    account_type, account_id, user_id, entry_type, amount,
    balance_after, reference_type, reference_id, description, created_by,
    metadata
  )
  SELECT
    'advertiser', p_advertiser_id, a.user_id, 'advertiser_prepay', p_amount,
    v_new_balance, 'point_packages', v_prepay_id, COALESCE(p_note, '관리자 선납 충전'), auth.uid(),
    jsonb_build_object(
      'reward_pool_amount', v_split.reward_pool,
      'partner_share_amount', v_split.partner_share,
      'adme_share_amount', v_split.adme_hq,
      'operation_reserve_amount', v_split.ops_pool,
      'buffer_amount', v_split.buffer_pool
    )
  FROM public.advertisers a
  WHERE a.id = p_advertiser_id
  RETURNING id INTO v_ledger_id;

  UPDATE public.advertiser_prepayments
  SET ledger_entry_id = v_ledger_id
  WHERE id = v_prepay_id;

  RETURN v_prepay_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_advertiser_prepayment(UUID, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_advertiser_prepayment(UUID, BIGINT, TEXT) TO authenticated;
