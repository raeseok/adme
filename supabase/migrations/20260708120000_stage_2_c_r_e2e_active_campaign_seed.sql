-- Stage 2-C-R: idempotent E2E active campaign + quiz for DB UUID verification
-- Non-destructive — fixed UUIDs, no point_ledger/ad_views mutation

DO $$
DECLARE
  v_adv_user_id UUID := 'e2e00001-0000-4000-8000-000000000001';
  v_campaign_id UUID := 'e2e00002-0000-4000-8000-000000000002';
  v_quiz_id UUID := 'e2e00003-0000-4000-8000-000000000003';
  v_region_id UUID;
  v_category_id UUID;
  v_advertiser_id UUID;
BEGIN
  SELECT id INTO v_region_id FROM public.regions WHERE code = 'KR-11-GANGNAM' LIMIT 1;
  SELECT id INTO v_category_id FROM public.interest_categories WHERE code = 'FOOD-CAFE' LIMIT 1;

  IF v_region_id IS NULL OR v_category_id IS NULL THEN
    RAISE NOTICE 'Stage 2-C-R E2E seed skipped — base region/category missing';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_adv_user_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_adv_user_id,
      'authenticated',
      'authenticated',
      'stage2cr-e2e-advertiser@adme.local',
      now(),
      '{"provider":"email","providers":["email"]}'::JSONB,
      '{"role":"advertiser","display_name":"Stage 2-C-R E2E Advertiser"}'::JSONB,
      now(),
      now()
    );
  END IF;

  SELECT id INTO v_advertiser_id FROM public.advertisers WHERE user_id = v_adv_user_id LIMIT 1;

  IF v_advertiser_id IS NULL THEN
    INSERT INTO public.advertisers (user_id, company_name)
    VALUES (v_adv_user_id, 'Stage 2-C-R E2E Advertiser')
    RETURNING id INTO v_advertiser_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE id = v_campaign_id) THEN
    INSERT INTO public.campaigns (
      id,
      advertiser_id,
      title,
      description,
      region_id,
      category_id,
      ad_content_text,
      budget_total,
      budget_spent,
      reward_per_view,
      max_views_per_consumer,
      status
    ) VALUES (
      v_campaign_id,
      v_advertiser_id,
      'Stage 2-C-R E2E Active Campaign',
      'Stage 2-C-R DB UUID verification campaign',
      v_region_id,
      v_category_id,
      'Stage 2-C-R E2E 광고 본문입니다. 주중 할인 혜택은 수요일에 적용됩니다.',
      100000,
      0,
      30,
      2,
      'active'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_quiz_id) THEN
    INSERT INTO public.quizzes (
      id,
      campaign_id,
      question_text,
      options,
      quiz_answer,
      sort_order,
      is_active
    ) VALUES (
      v_quiz_id,
      v_campaign_id,
      '광고 본문에 언급된 할인 혜택 적용 요일은?',
      '[
        {"id":"opt-e2e-a","label":"월요일"},
        {"id":"opt-e2e-b","label":"수요일"},
        {"id":"opt-e2e-c","label":"금요일"},
        {"id":"opt-e2e-d","label":"일요일"}
      ]'::JSONB,
      '수요일',
      0,
      true
    );
  END IF;

  RAISE NOTICE 'Stage 2-C-R E2E active campaign seed ready: %', v_campaign_id;
END $$;
