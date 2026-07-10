-- Stage 3-P dev DB validation.
-- Synthetic fixtures are created inside a transaction and rolled back.

BEGIN;

CREATE TEMP TABLE stage3p_validation_context AS
SELECT
  (SELECT id FROM public.profiles WHERE role = 'consumer' AND is_active = true ORDER BY created_at LIMIT 1) AS consumer_a,
  (SELECT id FROM public.profiles WHERE role = 'consumer' AND is_active = true ORDER BY created_at OFFSET 1 LIMIT 1) AS consumer_b,
  (SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = true ORDER BY created_at LIMIT 1) AS admin_user,
  (SELECT id FROM public.profiles WHERE role = 'advertiser' AND is_active = true ORDER BY created_at LIMIT 1) AS advertiser_user,
  (SELECT id FROM public.profiles WHERE role = 'partner' AND is_active = true ORDER BY created_at LIMIT 1) AS partner_user,
  gen_random_uuid() AS legal_document_version_id,
  gen_random_uuid() AS identity_verification_id,
  gen_random_uuid() AS bank_verification_id,
  gen_random_uuid() AS tax_profile_id,
  gen_random_uuid() AS legal_acceptance_id,
  gen_random_uuid() AS marketing_consent_id,
  gen_random_uuid() AS precondition_snapshot_id;

DO $$
DECLARE
  missing_actor_count INTEGER;
BEGIN
  SELECT
    (consumer_a IS NULL)::INT +
    (consumer_b IS NULL)::INT +
    (admin_user IS NULL)::INT +
    (advertiser_user IS NULL)::INT +
    (partner_user IS NULL)::INT
  INTO missing_actor_count
  FROM stage3p_validation_context;

  IF missing_actor_count <> 0 THEN
    RAISE EXCEPTION 'Stage 3-P validation requires active consumer/admin/advertiser/partner dev profiles';
  END IF;
END $$;

DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'consumer_identity_verifications',
    'consumer_bank_account_verifications',
    'consumer_tax_profiles',
    'legal_document_versions',
    'consumer_legal_acceptances',
    'consumer_marketing_consents',
    'cash_redemption_precondition_snapshots'
  ];
  v_table_name TEXT;
  missing_count INTEGER;
BEGIN
  FOREACH v_table_name IN ARRAY expected_tables LOOP
    IF to_regclass('public.' || v_table_name) IS NULL THEN
      RAISE EXCEPTION 'missing Stage 3-P table: %', v_table_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v_table_name
        AND c.relrowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on %', v_table_name;
    END IF;
  END LOOP;

  SELECT count(*)
  INTO missing_count
  FROM unnest(ARRAY[
    'real_name',
    'resident_registration_number',
    'ci',
    'di',
    'phone_number',
    'account_number',
    'account_number_last4',
    'account_number_hash',
    'account_holder_name',
    'raw_response',
    'access_token',
    'refresh_token',
    'oauth_code',
    'withholding_rate',
    'calculated_tax_amount'
  ]) AS forbidden(column_name)
  JOIN information_schema.columns c
    ON c.table_schema = 'public'
   AND c.table_name = ANY(expected_tables)
   AND c.column_name = forbidden.column_name;

  IF missing_count <> 0 THEN
    RAISE EXCEPTION 'forbidden Stage 3-P column exists';
  END IF;
END $$;

DO $$
DECLARE
  source_digest_tables TEXT[] := ARRAY[
    'consumer_identity_verifications',
    'consumer_bank_account_verifications',
    'consumer_tax_profiles',
    'consumer_legal_acceptances',
    'consumer_marketing_consents',
    'cash_redemption_precondition_snapshots'
  ];
  v_table_name TEXT;
BEGIN
  FOREACH v_table_name IN ARRAY source_digest_tables LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = v_table_name
        AND column_name = 'source_digest'
    ) THEN
      RAISE EXCEPTION 'missing source_digest on %', v_table_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = v_table_name
        AND constraint_type = 'UNIQUE'
    ) THEN
      RAISE EXCEPTION 'missing unique idempotency constraint on %', v_table_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cash_redemption_precondition_snapshots'
      AND column_name = 'available_point_balance'
      AND data_type = 'bigint'
  ) THEN
    RAISE EXCEPTION 'available_point_balance is not BIGINT';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cash_redemption_precondition_snapshots'
      AND column_name = 'requested_amount'
      AND data_type = 'bigint'
  ) THEN
    RAISE EXCEPTION 'requested_amount is not BIGINT';
  END IF;
END $$;

INSERT INTO public.legal_document_versions (
  id,
  document_type,
  version,
  title,
  content_digest,
  effective_at
)
SELECT
  legal_document_version_id,
  'stage3p_test_terms',
  'stage3p_test_v1',
  'Stage 3-P Test Terms',
  'digest_stage3p_test_terms',
  now()
FROM stage3p_validation_context;

INSERT INTO public.consumer_identity_verifications (
  id,
  consumer_id,
  provider_code,
  provider_reference,
  verification_method,
  status,
  reason_code,
  verified_at,
  source_digest,
  idempotency_key,
  created_by_actor_type
)
SELECT
  identity_verification_id,
  consumer_a,
  'test_provider',
  'ref_test_001',
  'test_method',
  'verified',
  'TEST_REASON',
  now(),
  'digest_stage3p_identity',
  'idem_stage3p_identity',
  'dev_fixture'
FROM stage3p_validation_context;

INSERT INTO public.consumer_bank_account_verifications (
  id,
  consumer_id,
  provider_code,
  provider_reference,
  bank_code,
  status,
  reason_code,
  verified_at,
  source_digest,
  idempotency_key,
  created_by_actor_type
)
SELECT
  bank_verification_id,
  consumer_a,
  'test_provider',
  'ref_test_001',
  'TEST',
  'verified',
  'TEST_REASON',
  now(),
  'digest_stage3p_bank',
  'idem_stage3p_bank',
  'dev_fixture'
FROM stage3p_validation_context;

INSERT INTO public.consumer_tax_profiles (
  id,
  consumer_id,
  status,
  review_reason_code,
  source_digest,
  idempotency_key
)
SELECT
  tax_profile_id,
  consumer_a,
  'pending_review',
  'TEST_REASON',
  'digest_stage3p_tax',
  'idem_stage3p_tax'
FROM stage3p_validation_context;

INSERT INTO public.consumer_legal_acceptances (
  id,
  consumer_id,
  legal_document_version_id,
  acceptance_status,
  accepted_at,
  source_channel,
  source_digest,
  idempotency_key
)
SELECT
  legal_acceptance_id,
  consumer_a,
  legal_document_version_id,
  'accepted',
  now(),
  'dev_fixture',
  'digest_stage3p_legal_acceptance',
  'idem_stage3p_legal_acceptance'
FROM stage3p_validation_context;

INSERT INTO public.consumer_marketing_consents (
  id,
  consumer_id,
  consent_channel,
  consent_action,
  legal_document_version_id,
  occurred_at,
  source_digest,
  idempotency_key
)
SELECT
  marketing_consent_id,
  consumer_a,
  'dev_fixture_channel',
  'opt_in',
  legal_document_version_id,
  now(),
  'digest_stage3p_marketing',
  'idem_stage3p_marketing'
FROM stage3p_validation_context;

INSERT INTO public.cash_redemption_precondition_snapshots (
  id,
  consumer_id,
  request_reference,
  identity_verification_status,
  identity_verification_reference,
  bank_verification_status,
  bank_verification_reference,
  tax_review_status,
  tax_profile_reference,
  required_terms_status,
  required_terms_version_references,
  protected_fund_status,
  minimum_threshold_status,
  available_point_balance,
  requested_amount,
  evaluator_version,
  evaluated_at,
  source_digest,
  idempotency_key
)
SELECT
  precondition_snapshot_id,
  consumer_a,
  'test_request_001',
  'verified',
  identity_verification_id,
  'verified',
  bank_verification_id,
  'pending_review',
  tax_profile_id,
  'accepted_current_versions',
  jsonb_build_array(legal_document_version_id::TEXT),
  'target_buffer_ok',
  'minimum_met',
  10000,
  10000,
  'stage3p_test_evaluator_v1',
  now(),
  'digest_stage3p_precondition',
  'idem_stage3p_precondition'
FROM stage3p_validation_context;

DO $$
BEGIN
  BEGIN
    INSERT INTO public.legal_document_versions (
      document_type,
      version,
      title,
      content_digest,
      effective_at
    )
    VALUES (
      'stage3p_test_terms',
      'stage3p_test_v1',
      'Stage 3-P Duplicate Test Terms',
      'digest_stage3p_duplicate',
      now()
    );
    RAISE EXCEPTION 'legal_document_versions duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: legal_document_versions duplicate version blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_identity_verifications (
      consumer_id,
      status,
      source_digest,
      idempotency_key,
      created_by_actor_type
    )
    SELECT consumer_a, 'verified', 'digest_duplicate_identity', 'idem_stage3p_identity', 'dev_fixture'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'consumer_identity_verifications duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: consumer_identity_verifications duplicate idempotency blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_bank_account_verifications (
      consumer_id,
      status,
      source_digest,
      idempotency_key,
      created_by_actor_type
    )
    SELECT consumer_a, 'verified', 'digest_duplicate_bank', 'idem_stage3p_bank', 'dev_fixture'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'consumer_bank_account_verifications duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: consumer_bank_account_verifications duplicate idempotency blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_tax_profiles (
      consumer_id,
      status,
      source_digest,
      idempotency_key
    )
    SELECT consumer_a, 'pending_review', 'digest_duplicate_tax', 'idem_stage3p_tax'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'consumer_tax_profiles duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: consumer_tax_profiles duplicate idempotency blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_legal_acceptances (
      consumer_id,
      legal_document_version_id,
      acceptance_status,
      source_channel,
      source_digest,
      idempotency_key
    )
    SELECT consumer_a, legal_document_version_id, 'accepted', 'dev_fixture', 'digest_duplicate_legal', 'idem_stage3p_legal_acceptance'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'consumer_legal_acceptances duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: consumer_legal_acceptances duplicate idempotency blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_marketing_consents (
      consumer_id,
      consent_channel,
      consent_action,
      occurred_at,
      source_digest,
      idempotency_key
    )
    SELECT consumer_a, 'dev_fixture_channel', 'opt_in', now(), 'digest_duplicate_marketing', 'idem_stage3p_marketing'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'consumer_marketing_consents duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: consumer_marketing_consents duplicate idempotency blocked';
  END;

  BEGIN
    INSERT INTO public.cash_redemption_precondition_snapshots (
      consumer_id,
      request_reference,
      identity_verification_status,
      bank_verification_status,
      tax_review_status,
      required_terms_status,
      protected_fund_status,
      minimum_threshold_status,
      available_point_balance,
      requested_amount,
      evaluator_version,
      evaluated_at,
      source_digest,
      idempotency_key
    )
    SELECT
      consumer_a,
      'test_request_001',
      'verified',
      'verified',
      'pending_review',
      'accepted_current_versions',
      'target_buffer_ok',
      'minimum_met',
      10000,
      10000,
      'stage3p_test_evaluator_v1',
      now(),
      'digest_duplicate_precondition',
      'idem_stage3p_precondition'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'cash_redemption_precondition_snapshots duplicate insert unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: cash_redemption_precondition_snapshots duplicate idempotency blocked';
  END;
END $$;

SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM count(*) FROM public.consumer_identity_verifications;
    RAISE EXCEPTION 'anonymous SELECT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: anonymous SELECT blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_identity_verifications (
      consumer_id,
      status,
      source_digest,
      idempotency_key,
      created_by_actor_type
    )
    VALUES (
      gen_random_uuid(),
      'pending',
      'digest_anon_insert',
      'idem_anon_insert',
      'dev_fixture'
    );
    RAISE EXCEPTION 'anonymous INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: anonymous INSERT blocked';
  END;
END $$;
RESET ROLE;

DO $$
DECLARE
  v_subject UUID;
BEGIN
  SELECT consumer_a INTO v_subject FROM stage3p_validation_context;
  PERFORM set_config('request.jwt.claim.sub', v_subject::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.consumer_identity_verifications;

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'consumer owner expected one visible identity row, got %', visible_count;
  END IF;

  BEGIN
    PERFORM provider_reference FROM public.consumer_identity_verifications;
    RAISE EXCEPTION 'consumer provider_reference projection unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: consumer provider_reference projection blocked';
  END;

  BEGIN
    PERFORM reason_code FROM public.consumer_identity_verifications;
    RAISE EXCEPTION 'consumer reason_code projection unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: consumer reason_code projection blocked';
  END;

  BEGIN
    INSERT INTO public.consumer_identity_verifications (
      consumer_id,
      status,
      source_digest,
      idempotency_key,
      created_by_actor_type
    )
    SELECT consumer_a, 'pending', 'digest_consumer_insert', 'idem_consumer_insert', 'dev_fixture'
    FROM stage3p_validation_context;
    RAISE EXCEPTION 'consumer direct INSERT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: consumer direct INSERT blocked';
  END;

  BEGIN
    UPDATE public.consumer_identity_verifications
    SET status = status;
    RAISE EXCEPTION 'consumer direct UPDATE unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: consumer direct UPDATE blocked';
  END;

  BEGIN
    DELETE FROM public.consumer_identity_verifications;
    RAISE EXCEPTION 'consumer direct DELETE unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: consumer direct DELETE blocked';
  END;
END $$;
RESET ROLE;

DO $$
DECLARE
  v_subject UUID;
BEGIN
  SELECT consumer_b INTO v_subject FROM stage3p_validation_context;
  PERFORM set_config('request.jwt.claim.sub', v_subject::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.consumer_identity_verifications;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'consumer non-owner expected zero visible identity rows, got %', visible_count;
  END IF;

  RAISE NOTICE 'PASS: consumer non-owner SELECT blocked by RLS';
END $$;
RESET ROLE;

DO $$
DECLARE
  v_subject UUID;
BEGIN
  SELECT advertiser_user INTO v_subject FROM stage3p_validation_context;
  PERFORM set_config('request.jwt.claim.sub', v_subject::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.consumer_identity_verifications;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'advertiser expected zero visible identity rows, got %', visible_count;
  END IF;

  RAISE NOTICE 'PASS: advertiser SELECT blocked by RLS';
END $$;
RESET ROLE;

DO $$
DECLARE
  v_subject UUID;
BEGIN
  SELECT partner_user INTO v_subject FROM stage3p_validation_context;
  PERFORM set_config('request.jwt.claim.sub', v_subject::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.consumer_identity_verifications;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'partner expected zero visible identity rows, got %', visible_count;
  END IF;

  RAISE NOTICE 'PASS: partner SELECT blocked by RLS';
END $$;
RESET ROLE;

DO $$
DECLARE
  v_subject UUID;
BEGIN
  SELECT admin_user INTO v_subject FROM stage3p_validation_context;
  PERFORM set_config('request.jwt.claim.sub', v_subject::TEXT, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  SELECT count(*) INTO visible_count
  FROM public.consumer_identity_verifications;

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'admin expected one visible identity row, got %', visible_count;
  END IF;

  RAISE NOTICE 'PASS: admin read-only SELECT allowed';

  BEGIN
    UPDATE public.consumer_identity_verifications
    SET status = status;
    RAISE EXCEPTION 'admin direct UPDATE unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: admin direct UPDATE blocked';
  END;
END $$;
RESET ROLE;

SELECT 'PASS: Stage 3-P dev schema, RLS, idempotency validation completed with rollback' AS result;

ROLLBACK;
