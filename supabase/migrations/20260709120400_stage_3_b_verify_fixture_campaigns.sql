-- Stage 3-B verify fixtures: extra campaigns (one ad_view per consumer/campaign/day)

DO $$
DECLARE
  v_adv_user_id UUID := 'e2e00001-0000-4000-8000-000000000001';
  v_region_id UUID;
  v_category_id UUID;
  v_advertiser_id UUID;
  v_campaign_wrong UUID := 'e2e00006-0000-4000-8000-000000000006';
  v_quiz_wrong UUID := 'e2e00007-0000-4000-8000-000000000007';
  v_campaign_minview UUID := 'e2e00008-0000-4000-8000-000000000008';
  v_quiz_minview UUID := 'e2e00009-0000-4000-8000-000000000009';
  v_campaign_rollback UUID := 'e2e0000a-0000-4000-8000-00000000000a';
  v_quiz_rollback UUID := 'e2e0000b-0000-4000-8000-00000000000b';
BEGIN
  SELECT id INTO v_region_id FROM public.regions WHERE code = 'KR-11-GANGNAM' LIMIT 1;
  SELECT id INTO v_category_id FROM public.interest_categories WHERE code = 'FOOD-CAFE' LIMIT 1;
  SELECT id INTO v_advertiser_id FROM public.advertisers WHERE user_id = v_adv_user_id LIMIT 1;

  IF v_region_id IS NULL OR v_category_id IS NULL OR v_advertiser_id IS NULL THEN
    RAISE NOTICE 'Stage 3-B extra fixtures skipped — base seed missing';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE id = v_campaign_wrong) THEN
    INSERT INTO public.campaigns (
      id, advertiser_id, title, region_id, category_id, ad_content_text,
      budget_total, budget_spent, reward_per_view, max_views_per_consumer, status
    ) VALUES (
      v_campaign_wrong, v_advertiser_id, 'Stage 3-B Wrong Attempt Fixture',
      v_region_id, v_category_id, 'Stage 3-B wrong attempt fixture.',
      100000, 0, 30, 2, 'active'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_quiz_wrong) THEN
    INSERT INTO public.quizzes (
      id, campaign_id, question_text, options, quiz_answer, sort_order, is_active
    ) VALUES (
      v_quiz_wrong, v_campaign_wrong, 'Stage 3-B wrong attempt Q?',
      '[{"id":"w-a","label":"수요일"},{"id":"w-b","label":"월요일"}]'::JSONB,
      '수요일', 0, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE id = v_campaign_minview) THEN
    INSERT INTO public.campaigns (
      id, advertiser_id, title, region_id, category_id, ad_content_text,
      budget_total, budget_spent, reward_per_view, max_views_per_consumer, status
    ) VALUES (
      v_campaign_minview, v_advertiser_id, 'Stage 3-B Min View Fixture',
      v_region_id, v_category_id, 'Stage 3-B min view fixture.',
      100000, 0, 30, 2, 'active'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_quiz_minview) THEN
    INSERT INTO public.quizzes (
      id, campaign_id, question_text, options, quiz_answer, sort_order, is_active
    ) VALUES (
      v_quiz_minview, v_campaign_minview, 'Stage 3-B min view Q?',
      '[{"id":"m-a","label":"수요일"},{"id":"m-b","label":"월요일"}]'::JSONB,
      '수요일', 0, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE id = v_campaign_rollback) THEN
    INSERT INTO public.campaigns (
      id, advertiser_id, title, region_id, category_id, ad_content_text,
      budget_total, budget_spent, reward_per_view, max_views_per_consumer, status
    ) VALUES (
      v_campaign_rollback, v_advertiser_id, 'Stage 3-B Rollback Fixture',
      v_region_id, v_category_id, 'Stage 3-B rollback fixture.',
      100000, 0, 30, 2, 'active'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_quiz_rollback) THEN
    INSERT INTO public.quizzes (
      id, campaign_id, question_text, options, quiz_answer, sort_order, is_active
    ) VALUES (
      v_quiz_rollback, v_campaign_rollback, 'Stage 3-B rollback Q?',
      '[{"id":"r-a","label":"수요일"},{"id":"r-b","label":"월요일"}]'::JSONB,
      '수요일', 0, true
    );
  END IF;

  RAISE NOTICE 'Stage 3-B extra verify fixtures ready';
END $$;
