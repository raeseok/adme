-- Stage 1-F: allow anon read of active reference regions (SELECT only, no write)
-- Required for /admin/diagnostics counts and anonymous /consumer/profile region preview.

CREATE POLICY regions_select_active_anon ON public.regions
  FOR SELECT TO anon
  USING (is_active = true);
