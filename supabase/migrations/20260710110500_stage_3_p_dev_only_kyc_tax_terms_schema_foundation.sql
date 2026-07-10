-- AdMe Stage 3-P: Dev-only KYC/Tax/Terms Schema Foundation
-- Apply only to dev Supabase project ref: ogncvdxrrsjnwsuvgoyh.
-- Do not apply to production project ref: vupsalteyltjqumppltc.
-- Provider-neutral schema only: no raw identity data, no raw bank account data,
-- no provider raw payload, no provider credentials, no tax calculation, and no cash-out execution.

-- ---------------------------------------------------------------------------
-- consumer_identity_verifications
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider_code TEXT,
  provider_reference TEXT,
  verification_method TEXT,
  status TEXT NOT NULL,
  reason_code TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_actor_type TEXT NOT NULL,
  CONSTRAINT consumer_identity_verifications_status_check
    CHECK (status IN ('pending', 'verified', 'failed', 'expired', 'revoked', 'manual_review_required')),
  CONSTRAINT consumer_identity_verifications_actor_check
    CHECK (created_by_actor_type IN ('trusted_server', 'admin_review', 'provider_callback', 'dev_fixture')),
  CONSTRAINT consumer_identity_verifications_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT consumer_identity_verifications_idempotency_key_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT consumer_identity_verifications_unique_idempotency
    UNIQUE (consumer_id, idempotency_key)
);

CREATE INDEX consumer_identity_verifications_consumer_created_idx
  ON public.consumer_identity_verifications (consumer_id, created_at DESC);
CREATE INDEX consumer_identity_verifications_status_idx
  ON public.consumer_identity_verifications (status);

COMMENT ON TABLE public.consumer_identity_verifications IS
  'Stage 3-P dev-only provider-neutral identity verification metadata. No real name, birth date, phone number, RRN, CI, DI, raw provider payload, OAuth code, or token is stored.';

-- ---------------------------------------------------------------------------
-- consumer_bank_account_verifications
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_bank_account_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider_code TEXT,
  provider_reference TEXT,
  bank_code TEXT,
  status TEXT NOT NULL,
  reason_code TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_actor_type TEXT NOT NULL,
  CONSTRAINT consumer_bank_account_verifications_status_check
    CHECK (status IN ('pending', 'verified', 'failed', 'expired', 'revoked', 'manual_review_required')),
  CONSTRAINT consumer_bank_account_verifications_actor_check
    CHECK (created_by_actor_type IN ('trusted_server', 'admin_review', 'provider_callback', 'dev_fixture')),
  CONSTRAINT consumer_bank_account_verifications_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT consumer_bank_account_verifications_idempotency_key_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT consumer_bank_account_verifications_unique_idempotency
    UNIQUE (consumer_id, idempotency_key)
);

CREATE INDEX consumer_bank_account_verifications_consumer_created_idx
  ON public.consumer_bank_account_verifications (consumer_id, created_at DESC);
CREATE INDEX consumer_bank_account_verifications_status_idx
  ON public.consumer_bank_account_verifications (status);

COMMENT ON TABLE public.consumer_bank_account_verifications IS
  'Stage 3-P dev-only provider-neutral bank verification metadata. No account number, last4, account hash, holder name, raw provider payload, or token is stored.';

-- ---------------------------------------------------------------------------
-- consumer_tax_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  review_reason_code TEXT,
  classification_code TEXT,
  reviewed_at TIMESTAMPTZ,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumer_tax_profiles_status_check
    CHECK (status IN ('not_started', 'pending_review', 'review_required', 'reviewed', 'blocked', 'external_review_required', 'manual_review_required')),
  CONSTRAINT consumer_tax_profiles_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT consumer_tax_profiles_idempotency_key_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT consumer_tax_profiles_unique_idempotency
    UNIQUE (consumer_id, idempotency_key)
);

CREATE INDEX consumer_tax_profiles_consumer_created_idx
  ON public.consumer_tax_profiles (consumer_id, created_at DESC);
CREATE INDEX consumer_tax_profiles_status_idx
  ON public.consumer_tax_profiles (status);

COMMENT ON TABLE public.consumer_tax_profiles IS
  'Stage 3-P dev-only tax review status only. classification_code is nullable and does not declare a tax classification, rate, withholding, report, or calculated tax amount.';

-- ---------------------------------------------------------------------------
-- legal_document_versions
-- ---------------------------------------------------------------------------

CREATE TABLE public.legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content_digest TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  retired_at TIMESTAMPTZ,
  requires_reacceptance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT legal_document_versions_document_type_not_blank
    CHECK (length(btrim(document_type)) > 0),
  CONSTRAINT legal_document_versions_version_not_blank
    CHECK (length(btrim(version)) > 0),
  CONSTRAINT legal_document_versions_title_not_blank
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT legal_document_versions_content_digest_not_blank
    CHECK (length(btrim(content_digest)) > 0),
  CONSTRAINT legal_document_versions_unique_version
    UNIQUE (document_type, version)
);

CREATE INDEX legal_document_versions_type_effective_idx
  ON public.legal_document_versions (document_type, effective_at DESC);

COMMENT ON TABLE public.legal_document_versions IS
  'Stage 3-P dev-only legal document version metadata. Legal text fixtures are not inserted; content_digest records immutable content identity only.';

-- ---------------------------------------------------------------------------
-- consumer_legal_acceptances
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  legal_document_version_id UUID NOT NULL REFERENCES public.legal_document_versions(id) ON DELETE RESTRICT,
  acceptance_status TEXT NOT NULL,
  accepted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  source_channel TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumer_legal_acceptances_status_check
    CHECK (acceptance_status IN ('accepted', 'withdrawn', 'revoked', 'reacceptance_required')),
  CONSTRAINT consumer_legal_acceptances_source_channel_not_blank
    CHECK (length(btrim(source_channel)) > 0),
  CONSTRAINT consumer_legal_acceptances_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT consumer_legal_acceptances_idempotency_key_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT consumer_legal_acceptances_unique_idempotency
    UNIQUE (consumer_id, legal_document_version_id, idempotency_key)
);

CREATE INDEX consumer_legal_acceptances_consumer_created_idx
  ON public.consumer_legal_acceptances (consumer_id, created_at DESC);
CREATE INDEX consumer_legal_acceptances_document_idx
  ON public.consumer_legal_acceptances (legal_document_version_id);

COMMENT ON TABLE public.consumer_legal_acceptances IS
  'Stage 3-P dev-only append-only legal acceptance metadata. No raw IP address, user-agent, device fingerprint, or signature image is stored.';

-- ---------------------------------------------------------------------------
-- consumer_marketing_consents
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_marketing_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  consent_channel TEXT NOT NULL,
  consent_action TEXT NOT NULL,
  legal_document_version_id UUID REFERENCES public.legal_document_versions(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumer_marketing_consents_action_check
    CHECK (consent_action IN ('opt_in', 'opt_out', 'withdrawn')),
  CONSTRAINT consumer_marketing_consents_channel_not_blank
    CHECK (length(btrim(consent_channel)) > 0),
  CONSTRAINT consumer_marketing_consents_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT consumer_marketing_consents_idempotency_key_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT consumer_marketing_consents_unique_idempotency
    UNIQUE (consumer_id, consent_channel, idempotency_key)
);

CREATE INDEX consumer_marketing_consents_consumer_created_idx
  ON public.consumer_marketing_consents (consumer_id, created_at DESC);
CREATE INDEX consumer_marketing_consents_document_idx
  ON public.consumer_marketing_consents (legal_document_version_id);

COMMENT ON TABLE public.consumer_marketing_consents IS
  'Stage 3-P dev-only append-only optional marketing consent event history. Marketing consent is not a cash-out prerequisite.';

-- ---------------------------------------------------------------------------
-- cash_redemption_precondition_snapshots
-- ---------------------------------------------------------------------------

CREATE TABLE public.cash_redemption_precondition_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  request_reference TEXT NOT NULL,
  identity_verification_status TEXT NOT NULL,
  identity_verification_reference UUID REFERENCES public.consumer_identity_verifications(id) ON DELETE RESTRICT,
  bank_verification_status TEXT NOT NULL,
  bank_verification_reference UUID REFERENCES public.consumer_bank_account_verifications(id) ON DELETE RESTRICT,
  tax_review_status TEXT NOT NULL,
  tax_profile_reference UUID REFERENCES public.consumer_tax_profiles(id) ON DELETE RESTRICT,
  required_terms_status TEXT NOT NULL,
  required_terms_version_references JSONB NOT NULL DEFAULT '[]'::JSONB,
  protected_fund_status TEXT NOT NULL,
  minimum_threshold_status TEXT NOT NULL,
  available_point_balance BIGINT NOT NULL,
  requested_amount BIGINT NOT NULL,
  evaluator_version TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cash_redemption_precondition_snapshots_request_reference_not_blank
    CHECK (length(btrim(request_reference)) > 0),
  CONSTRAINT cash_redemption_precondition_snapshots_identity_status_check
    CHECK (identity_verification_status IN ('pending', 'verified', 'failed', 'expired', 'revoked', 'manual_review_required')),
  CONSTRAINT cash_redemption_precondition_snapshots_bank_status_check
    CHECK (bank_verification_status IN ('pending', 'verified', 'failed', 'expired', 'revoked', 'manual_review_required')),
  CONSTRAINT cash_redemption_precondition_snapshots_tax_status_check
    CHECK (tax_review_status IN ('not_started', 'pending_review', 'review_required', 'reviewed', 'blocked', 'external_review_required', 'manual_review_required')),
  CONSTRAINT cash_redemption_precondition_snapshots_terms_status_check
    CHECK (required_terms_status IN ('missing_required_acceptance', 'accepted_current_versions', 'accepted_legacy_versions_reacceptance_required', 'revoked_or_withdrawn', 'version_unknown_blocked')),
  CONSTRAINT cash_redemption_precondition_snapshots_protected_fund_status_check
    CHECK (protected_fund_status IN ('unknown_blocked', 'deficit_blocked', 'minimum_covered_warning', 'covered_below_target_buffer', 'target_buffer_ok', 'no_liability_observed')),
  CONSTRAINT cash_redemption_precondition_snapshots_threshold_status_check
    CHECK (minimum_threshold_status IN ('unknown_blocked', 'below_minimum_blocked', 'minimum_met')),
  CONSTRAINT cash_redemption_precondition_snapshots_terms_refs_array_check
    CHECK (jsonb_typeof(required_terms_version_references) = 'array'),
  CONSTRAINT cash_redemption_precondition_snapshots_available_balance_check
    CHECK (available_point_balance >= 0),
  CONSTRAINT cash_redemption_precondition_snapshots_requested_amount_check
    CHECK (requested_amount > 0),
  CONSTRAINT cash_redemption_precondition_snapshots_evaluator_version_not_blank
    CHECK (length(btrim(evaluator_version)) > 0),
  CONSTRAINT cash_redemption_precondition_snapshots_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT cash_redemption_precondition_snapshots_idempotency_key_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT cash_redemption_precondition_snapshots_unique_idempotency
    UNIQUE (consumer_id, idempotency_key)
);

CREATE INDEX cash_redemption_precondition_snapshots_consumer_created_idx
  ON public.cash_redemption_precondition_snapshots (consumer_id, created_at DESC);
CREATE INDEX cash_redemption_precondition_snapshots_request_reference_idx
  ON public.cash_redemption_precondition_snapshots (request_reference);

COMMENT ON TABLE public.cash_redemption_precondition_snapshots IS
  'Stage 3-P dev-only evidence snapshot. This table does not create cash_redemption_requests, does not mutate point_ledger, does not change balances, and does not execute payout.';

-- ---------------------------------------------------------------------------
-- RLS, direct grants, and read-only policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.consumer_identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_bank_account_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_marketing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_redemption_precondition_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.consumer_identity_verifications FROM anon, authenticated;
REVOKE ALL ON TABLE public.consumer_bank_account_verifications FROM anon, authenticated;
REVOKE ALL ON TABLE public.consumer_tax_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.legal_document_versions FROM anon, authenticated;
REVOKE ALL ON TABLE public.consumer_legal_acceptances FROM anon, authenticated;
REVOKE ALL ON TABLE public.consumer_marketing_consents FROM anon, authenticated;
REVOKE ALL ON TABLE public.cash_redemption_precondition_snapshots FROM anon, authenticated;

GRANT SELECT (id, consumer_id, verification_method, status, verified_at, expires_at, created_at)
  ON public.consumer_identity_verifications TO authenticated;
GRANT SELECT (id, consumer_id, bank_code, status, verified_at, expires_at, created_at)
  ON public.consumer_bank_account_verifications TO authenticated;
GRANT SELECT (id, consumer_id, status, reviewed_at, created_at)
  ON public.consumer_tax_profiles TO authenticated;
GRANT SELECT (id, document_type, version, title, content_digest, effective_at, retired_at, requires_reacceptance, created_at)
  ON public.legal_document_versions TO authenticated;
GRANT SELECT (id, consumer_id, legal_document_version_id, acceptance_status, accepted_at, withdrawn_at, source_channel, created_at)
  ON public.consumer_legal_acceptances TO authenticated;
GRANT SELECT (id, consumer_id, consent_channel, consent_action, legal_document_version_id, occurred_at, created_at)
  ON public.consumer_marketing_consents TO authenticated;
GRANT SELECT (
  id,
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
  created_at
) ON public.cash_redemption_precondition_snapshots TO authenticated;

CREATE POLICY consumer_identity_verifications_select_owner ON public.consumer_identity_verifications
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer());
CREATE POLICY consumer_identity_verifications_select_admin ON public.consumer_identity_verifications
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY consumer_bank_account_verifications_select_owner ON public.consumer_bank_account_verifications
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer());
CREATE POLICY consumer_bank_account_verifications_select_admin ON public.consumer_bank_account_verifications
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY consumer_tax_profiles_select_owner ON public.consumer_tax_profiles
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer());
CREATE POLICY consumer_tax_profiles_select_admin ON public.consumer_tax_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY legal_document_versions_select_admin ON public.legal_document_versions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY consumer_legal_acceptances_select_owner ON public.consumer_legal_acceptances
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer());
CREATE POLICY consumer_legal_acceptances_select_admin ON public.consumer_legal_acceptances
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY consumer_marketing_consents_select_owner ON public.consumer_marketing_consents
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer());
CREATE POLICY consumer_marketing_consents_select_admin ON public.consumer_marketing_consents
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY cash_redemption_precondition_snapshots_select_owner ON public.cash_redemption_precondition_snapshots
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer());
CREATE POLICY cash_redemption_precondition_snapshots_select_admin ON public.cash_redemption_precondition_snapshots
  FOR SELECT TO authenticated
  USING (public.is_admin());
