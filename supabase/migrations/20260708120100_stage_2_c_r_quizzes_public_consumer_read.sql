-- Stage 2-C-R: quizzes_public readable for active campaigns (quiz_answer still excluded)
-- security_invoker=true caused consumer reads to inherit quizzes admin-only RLS

CREATE OR REPLACE VIEW public.quizzes_public
WITH (security_invoker = false)
AS
SELECT
  q.id,
  q.campaign_id,
  q.question_text,
  q.options,
  q.sort_order,
  q.is_active,
  q.created_at,
  q.updated_at
FROM public.quizzes q
JOIN public.campaigns c ON c.id = q.campaign_id
WHERE q.is_active = true
  AND c.status = 'active';

COMMENT ON VIEW public.quizzes_public IS
  'Stage 2-C-R: active campaign quiz metadata — quiz_answer never exposed';

GRANT SELECT ON public.quizzes_public TO authenticated;
GRANT SELECT ON public.quizzes_public TO anon;
