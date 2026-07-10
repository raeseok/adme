-- AdMe Stage 3-Q: Cash Redemption Demo State Machine
-- Dev-only sandbox migration. Apply only to dev Supabase project ref: ogncvdxrrsjnwsuvgoyh.
-- Do not apply to production project ref: vupsalteyltjqumppltc.
-- No actual payout, no point_ledger cash_out, no balance deduction, no tax calculation.

CREATE TABLE public.cash_redemption_demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  request_reference TEXT NOT NULL,
  requested_amount BIGINT NOT NULL,
  displayed_available_balance BIGINT NOT NULL,
  status TEXT NOT NULL,
  eligibility_result TEXT NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  precondition_snapshot_id UUID REFERENCES public.cash_redemption_precondition_snapshots(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  demo_completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  current_reason_code TEXT,
  consumer_message_code TEXT,
  idempotency_key TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cash_redemption_demo_requests_reference_not_blank
    CHECK (length(btrim(request_reference)) > 0),
  CONSTRAINT cash_redemption_demo_requests_amount_positive
    CHECK (requested_amount > 0),
  CONSTRAINT cash_redemption_demo_requests_displayed_balance_nonnegative
    CHECK (displayed_available_balance >= 0),
  CONSTRAINT cash_redemption_demo_requests_status_check
    CHECK (status IN (
      'draft',
      'eligibility_check_required',
      'eligible',
      'ineligible',
      'submitted',
      'under_review',
      'on_hold',
      'approved',
      'rejected',
      'processing',
      'demo_completed',
      'cancelled',
      'expired'
    )),
  CONSTRAINT cash_redemption_demo_requests_eligibility_check
    CHECK (eligibility_result IN (
      'eligible',
      'insufficient_balance',
      'identity_verification_required',
      'bank_verification_required',
      'tax_review_required',
      'required_terms_missing',
      'protected_fund_check_failed',
      'minimum_threshold_not_met',
      'account_restricted',
      'manual_review_required'
    )),
  CONSTRAINT cash_redemption_demo_requests_sandbox_only
    CHECK (is_sandbox = true),
  CONSTRAINT cash_redemption_demo_requests_idempotency_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT cash_redemption_demo_requests_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT cash_redemption_demo_requests_unique_idempotency
    UNIQUE (consumer_id, idempotency_key),
  CONSTRAINT cash_redemption_demo_requests_unique_reference
    UNIQUE (request_reference)
);

CREATE INDEX cash_redemption_demo_requests_consumer_created_idx
  ON public.cash_redemption_demo_requests (consumer_id, created_at DESC);
CREATE INDEX cash_redemption_demo_requests_status_idx
  ON public.cash_redemption_demo_requests (status, created_at DESC);

COMMENT ON TABLE public.cash_redemption_demo_requests IS
  'Stage 3-Q sandbox cash redemption demo requests only. No payout reference, account reference, withholding, tax amount, point_ledger cash_out, or balance deduction.';

CREATE TABLE public.cash_redemption_demo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.cash_redemption_demo_requests(id) ON DELETE RESTRICT,
  previous_status TEXT,
  next_status TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason_code TEXT,
  note_code TEXT,
  idempotency_key TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cash_redemption_demo_events_status_check
    CHECK (
      next_status IN (
        'draft',
        'eligibility_check_required',
        'eligible',
        'ineligible',
        'submitted',
        'under_review',
        'on_hold',
        'approved',
        'rejected',
        'processing',
        'demo_completed',
        'cancelled',
        'expired'
      )
      AND (previous_status IS NULL OR previous_status IN (
        'draft',
        'eligibility_check_required',
        'eligible',
        'ineligible',
        'submitted',
        'under_review',
        'on_hold',
        'approved',
        'rejected',
        'processing',
        'demo_completed',
        'cancelled',
        'expired'
      ))
    ),
  CONSTRAINT cash_redemption_demo_events_type_check
    CHECK (event_type IN (
      'request_created',
      'eligibility_evaluated',
      'submitted',
      'review_started',
      'placed_on_hold',
      'approved',
      'rejected',
      'processing_started',
      'demo_completed',
      'cancelled',
      'expired'
    )),
  CONSTRAINT cash_redemption_demo_events_actor_check
    CHECK (actor_type IN ('consumer', 'admin', 'system_demo')),
  CONSTRAINT cash_redemption_demo_events_idempotency_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT cash_redemption_demo_events_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT cash_redemption_demo_events_unique_idempotency
    UNIQUE (request_id, idempotency_key)
);

CREATE INDEX cash_redemption_demo_events_request_created_idx
  ON public.cash_redemption_demo_events (request_id, created_at ASC);

COMMENT ON TABLE public.cash_redemption_demo_events IS
  'Stage 3-Q append-only sandbox event history. note_code is used instead of free-text personal data.';

CREATE TABLE public.cash_redemption_demo_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.cash_redemption_demo_requests(id) ON DELETE RESTRICT,
  reviewer_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewer_role TEXT NOT NULL,
  assignment_status TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  source_digest TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cash_redemption_demo_assignments_role_check
    CHECK (reviewer_role IN ('admin_reviewer', 'admin_checker', 'system_demo')),
  CONSTRAINT cash_redemption_demo_assignments_status_check
    CHECK (assignment_status IN ('pending', 'active', 'completed', 'cancelled')),
  CONSTRAINT cash_redemption_demo_assignments_source_digest_not_blank
    CHECK (length(btrim(source_digest)) > 0),
  CONSTRAINT cash_redemption_demo_assignments_idempotency_not_blank
    CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT cash_redemption_demo_assignments_unique_idempotency
    UNIQUE (request_id, idempotency_key)
);

CREATE INDEX cash_redemption_demo_assignments_request_idx
  ON public.cash_redemption_demo_review_assignments (request_id, created_at DESC);

ALTER TABLE public.cash_redemption_demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_redemption_demo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_redemption_demo_review_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.cash_redemption_demo_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.cash_redemption_demo_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.cash_redemption_demo_review_assignments FROM anon, authenticated;

GRANT SELECT (
  id,
  consumer_id,
  request_reference,
  requested_amount,
  displayed_available_balance,
  status,
  eligibility_result,
  is_sandbox,
  precondition_snapshot_id,
  submitted_at,
  reviewed_at,
  demo_completed_at,
  cancelled_at,
  consumer_message_code,
  created_at
) ON public.cash_redemption_demo_requests TO authenticated;

GRANT SELECT (
  id,
  request_id,
  previous_status,
  next_status,
  event_type,
  actor_type,
  note_code,
  occurred_at,
  created_at
) ON public.cash_redemption_demo_events TO authenticated;

GRANT SELECT (
  id,
  request_id,
  reviewer_user_id,
  reviewer_role,
  assignment_status,
  assigned_at,
  completed_at,
  created_at
) ON public.cash_redemption_demo_review_assignments TO authenticated;

CREATE POLICY cash_redemption_demo_requests_select_owner
  ON public.cash_redemption_demo_requests
  FOR SELECT TO authenticated
  USING (consumer_id = auth.uid() AND public.is_consumer() AND is_sandbox = true);

CREATE POLICY cash_redemption_demo_requests_select_admin
  ON public.cash_redemption_demo_requests
  FOR SELECT TO authenticated
  USING (public.is_admin() AND is_sandbox = true);

CREATE POLICY cash_redemption_demo_events_select_owner
  ON public.cash_redemption_demo_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cash_redemption_demo_requests r
      WHERE r.id = request_id
        AND r.consumer_id = auth.uid()
        AND r.is_sandbox = true
    )
    AND public.is_consumer()
  );

CREATE POLICY cash_redemption_demo_events_select_admin
  ON public.cash_redemption_demo_events
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.cash_redemption_demo_requests r
      WHERE r.id = request_id
        AND r.is_sandbox = true
    )
  );

CREATE POLICY cash_redemption_demo_assignments_select_admin
  ON public.cash_redemption_demo_review_assignments
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.stage3q_demo_allowed_dev_project_ref()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'ogncvdxrrsjnwsuvgoyh'::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.stage3q_demo_assert_dev_only_jwt()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_iss TEXT;
  v_allowed TEXT := public.stage3q_demo_allowed_dev_project_ref();
BEGIN
  v_iss := COALESCE(auth.jwt() ->> 'iss', '');

  IF v_iss = '' THEN
    RAISE EXCEPTION 'STAGE3Q_AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF position('vupsalteyltjqumppltc' IN v_iss) > 0 THEN
    RAISE EXCEPTION 'STAGE3Q_PRODUCTION_BLOCKED' USING ERRCODE = 'P0001';
  END IF;

  IF position(v_allowed IN v_iss) = 0 THEN
    RAISE EXCEPTION 'STAGE3Q_DEV_PROJECT_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.stage3q_demo_transition_allowed(
  p_previous_status TEXT,
  p_next_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_previous_status = 'draft' AND p_next_status = 'eligibility_check_required' THEN true
    WHEN p_previous_status = 'eligibility_check_required' AND p_next_status IN ('eligible', 'ineligible') THEN true
    WHEN p_previous_status = 'eligible' AND p_next_status = 'submitted' THEN true
    WHEN p_previous_status = 'submitted' AND p_next_status IN ('under_review', 'cancelled') THEN true
    WHEN p_previous_status = 'under_review' AND p_next_status IN ('on_hold', 'approved', 'rejected') THEN true
    WHEN p_previous_status = 'on_hold' AND p_next_status IN ('under_review', 'rejected', 'cancelled') THEN true
    WHEN p_previous_status = 'approved' AND p_next_status = 'processing' THEN true
    WHEN p_previous_status = 'processing' AND p_next_status = 'demo_completed' THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.stage3q_demo_assert_transition(
  p_previous_status TEXT,
  p_next_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.stage3q_demo_transition_allowed(p_previous_status, p_next_status) THEN
    RAISE EXCEPTION 'STAGE3Q_INVALID_TRANSITION:%->%', p_previous_status, p_next_status
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.stage3q_demo_build_digest(
  p_prefix TEXT,
  p_key TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT md5(p_prefix || ':' || p_key);
$$;

CREATE OR REPLACE FUNCTION public.stage3q_demo_insert_event(
  p_request_id UUID,
  p_previous_status TEXT,
  p_next_status TEXT,
  p_event_type TEXT,
  p_actor_type TEXT,
  p_actor_user_id UUID,
  p_reason_code TEXT,
  p_note_code TEXT,
  p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.cash_redemption_demo_events (
    request_id,
    previous_status,
    next_status,
    event_type,
    actor_type,
    actor_user_id,
    reason_code,
    note_code,
    idempotency_key,
    source_digest
  )
  VALUES (
    p_request_id,
    p_previous_status,
    p_next_status,
    p_event_type,
    p_actor_type,
    p_actor_user_id,
    p_reason_code,
    p_note_code,
    p_idempotency_key,
    public.stage3q_demo_build_digest('stage3q_event', p_idempotency_key)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_evaluate_cash_redemption(
  p_requested_amount BIGINT,
  p_displayed_available_balance BIGINT,
  p_scenario TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_status TEXT;
  v_eligibility TEXT;
  v_request_id UUID;
  v_snapshot_id UUID;
  v_reference TEXT;
BEGIN
  PERFORM public.stage3q_demo_assert_dev_only_jwt();

  IF v_uid IS NULL OR NOT public.is_consumer() THEN
    RAISE EXCEPTION 'STAGE3Q_CONSUMER_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF p_requested_amount <= 0 OR p_displayed_available_balance < 0 THEN
    RAISE EXCEPTION 'STAGE3Q_INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;

  v_eligibility := CASE
    WHEN p_scenario = 'low-balance' OR p_displayed_available_balance < 10000 THEN 'minimum_threshold_not_met'
    WHEN p_scenario = 'bank-required' THEN 'bank_verification_required'
    WHEN p_scenario = 'hold-then-approve' THEN 'manual_review_required'
    WHEN p_displayed_available_balance < p_requested_amount THEN 'insufficient_balance'
    ELSE 'eligible'
  END;

  v_status := CASE WHEN v_eligibility = 'eligible' THEN 'eligible' ELSE 'ineligible' END;
  v_reference := 'STAGE3Q-' || left(replace(v_uid::TEXT, '-', ''), 8) || '-' || left(replace(p_idempotency_key, '-', ''), 12);

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
  VALUES (
    v_uid,
    v_reference,
    CASE WHEN p_scenario = 'identity-required' THEN 'pending' ELSE 'verified' END,
    CASE WHEN p_scenario = 'bank-required' THEN 'pending' ELSE 'verified' END,
    'reviewed',
    'accepted_current_versions',
    'target_buffer_ok',
    CASE WHEN v_eligibility = 'minimum_threshold_not_met' THEN 'below_minimum_blocked' ELSE 'minimum_met' END,
    p_displayed_available_balance,
    p_requested_amount,
    'stage3q_demo_evaluator_v1_sandbox',
    now(),
    public.stage3q_demo_build_digest('stage3q_snapshot', p_idempotency_key),
    p_idempotency_key || ':snapshot'
  )
  RETURNING id INTO v_snapshot_id;

  INSERT INTO public.cash_redemption_demo_requests (
    consumer_id,
    request_reference,
    requested_amount,
    displayed_available_balance,
    status,
    eligibility_result,
    is_sandbox,
    precondition_snapshot_id,
    current_reason_code,
    consumer_message_code,
    idempotency_key,
    source_digest
  )
  VALUES (
    v_uid,
    v_reference,
    p_requested_amount,
    p_displayed_available_balance,
    v_status,
    v_eligibility,
    true,
    v_snapshot_id,
    'STAGE3Q_' || upper(v_eligibility),
    'consumer_' || v_eligibility,
    p_idempotency_key,
    public.stage3q_demo_build_digest('stage3q_request', p_idempotency_key)
  )
  RETURNING id INTO v_request_id;

  PERFORM public.stage3q_demo_insert_event(
    v_request_id,
    'eligibility_check_required',
    v_status,
    'eligibility_evaluated',
    'consumer',
    v_uid,
    'STAGE3Q_' || upper(v_eligibility),
    'demo_eligibility_evaluated',
    p_idempotency_key || ':event:evaluate'
  );

  RETURN jsonb_build_object(
    'request_id', v_request_id,
    'status', v_status,
    'eligibility_result', v_eligibility,
    'is_sandbox', true,
    'actualPayout', false,
    'pointLedgerMutation', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.stage3q_demo_transition_request(
  p_request_id UUID,
  p_next_status TEXT,
  p_event_type TEXT,
  p_actor_type TEXT,
  p_reason_code TEXT,
  p_note_code TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_request public.cash_redemption_demo_requests%ROWTYPE;
BEGIN
  PERFORM public.stage3q_demo_assert_dev_only_jwt();

  SELECT *
  INTO v_request
  FROM public.cash_redemption_demo_requests
  WHERE id = p_request_id
    AND is_sandbox = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STAGE3Q_REQUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF p_actor_type = 'consumer' THEN
    IF v_uid IS NULL OR v_request.consumer_id <> v_uid OR NOT public.is_consumer() THEN
      RAISE EXCEPTION 'STAGE3Q_CONSUMER_OWNER_REQUIRED' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    IF v_uid IS NULL OR NOT public.is_admin() THEN
      RAISE EXCEPTION 'STAGE3Q_ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  PERFORM public.stage3q_demo_assert_transition(v_request.status, p_next_status);

  UPDATE public.cash_redemption_demo_requests
  SET
    status = p_next_status,
    submitted_at = CASE WHEN p_next_status = 'submitted' THEN now() ELSE submitted_at END,
    reviewed_at = CASE WHEN p_next_status IN ('under_review', 'on_hold', 'approved', 'rejected') THEN now() ELSE reviewed_at END,
    demo_completed_at = CASE WHEN p_next_status = 'demo_completed' THEN now() ELSE demo_completed_at END,
    cancelled_at = CASE WHEN p_next_status = 'cancelled' THEN now() ELSE cancelled_at END,
    current_reason_code = p_reason_code,
    consumer_message_code = p_note_code
  WHERE id = p_request_id;

  PERFORM public.stage3q_demo_insert_event(
    p_request_id,
    v_request.status,
    p_next_status,
    p_event_type,
    p_actor_type,
    v_uid,
    p_reason_code,
    p_note_code,
    p_idempotency_key
  );

  IF p_next_status = 'under_review' AND p_actor_type = 'admin' THEN
    INSERT INTO public.cash_redemption_demo_review_assignments (
      request_id,
      reviewer_user_id,
      reviewer_role,
      assignment_status,
      source_digest,
      idempotency_key
    )
    VALUES (
      p_request_id,
      v_uid,
      'admin_reviewer',
      'active',
      public.stage3q_demo_build_digest('stage3q_assignment', p_idempotency_key),
      p_idempotency_key || ':assignment'
    );
  END IF;

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'previous_status', v_request.status,
    'status', p_next_status,
    'is_sandbox', true,
    'actualPayout', false,
    'pointLedgerMutation', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_submit_cash_redemption(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'submitted', 'submitted', 'consumer',
    'STAGE3Q_SUBMITTED', 'consumer_request_submitted', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_start_review(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'under_review', 'review_started', 'admin',
    'STAGE3Q_REVIEW_STARTED', 'admin_review_started', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_place_on_hold(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'on_hold', 'placed_on_hold', 'admin',
    'STAGE3Q_ON_HOLD', 'admin_needs_more_review', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_approve(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'approved', 'approved', 'admin',
    'STAGE3Q_APPROVED', 'admin_demo_approved', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_reject(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'rejected', 'rejected', 'admin',
    'STAGE3Q_REJECTED', 'admin_demo_rejected', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_start_processing(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'processing', 'processing_started', 'admin',
    'STAGE3Q_PROCESSING', 'admin_demo_processing_started', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_complete(
  p_request_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.stage3q_demo_transition_request(
    p_request_id, 'demo_completed', 'demo_completed', 'admin',
    'STAGE3Q_DEMO_COMPLETED', 'admin_demo_completed', p_idempotency_key
  );
$$;

CREATE OR REPLACE FUNCTION public.rpc_stage3q_demo_reset()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_deleted_requests INT;
BEGIN
  PERFORM public.stage3q_demo_assert_dev_only_jwt();

  IF v_uid IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'STAGE3Q_ADMIN_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.cash_redemption_demo_review_assignments;
  DELETE FROM public.cash_redemption_demo_events;
  DELETE FROM public.cash_redemption_demo_requests
  WHERE is_sandbox = true;
  GET DIAGNOSTICS v_deleted_requests = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted_demo_requests', v_deleted_requests,
    'pointLedgerMutation', false,
    'profilesBalanceMutation', false,
    'cashRedemptionRequestsMutation', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.stage3q_demo_insert_event(
  UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stage3q_demo_transition_request(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_evaluate_cash_redemption(
  BIGINT, BIGINT, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_submit_cash_redemption(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_start_review(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_place_on_hold(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_approve(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_reject(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_start_processing(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_complete(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_stage3q_demo_reset() TO authenticated;
