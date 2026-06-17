-- ============================================================
-- Security L-09 / L-10: bound anon analytics + lead inserts — 2026-06-17
--
-- These are integrity/spam hardening (Low). We add only constraints that a
-- legitimate client payload always satisfies, so real scans/leads are never
-- rejected. Full anti-forgery (rate limiting) would need an edge function and
-- is intentionally out of scope here.
-- ============================================================

-- L-09 — scan_events: known source values + length caps (block giant payloads
-- and arbitrary source strings). The consumer only ever sends short slugs,
-- language codes, a 'qr'/'direct' source, and a <=255-char user_agent.
DROP POLICY IF EXISTS "Public insert scan_events" ON public.scan_events;
CREATE POLICY "Public insert scan_events" ON public.scan_events
  FOR INSERT TO anon
  WITH CHECK (
    char_length(product_slug) <= 128
    AND char_length(coalesce(brand_slug, '')) <= 128
    AND char_length(coalesce(language, '')) <= 16
    AND char_length(coalesce(session_id, '')) <= 128
    AND char_length(coalesce(user_agent, '')) <= 1024
    AND (source IS NULL OR source IN ('qr', 'direct'))
  );

-- L-10 — activation_leads: keep the existing "must reference an active
-- activation" gate and add field size / rating bounds. Valid leads have short
-- name/email/phone, a 1–5 rating, and small custom_data.
DROP POLICY IF EXISTS "Public insert activation_leads" ON public.activation_leads;
CREATE POLICY "Public insert activation_leads" ON public.activation_leads
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activations
      WHERE id = activation_id
        AND status = 'active'
        AND (start_date IS NULL OR start_date <= now())
        AND (end_date   IS NULL OR end_date   >= now())
    )
    AND char_length(coalesce(name, ''))  <= 200
    AND char_length(coalesce(email, '')) <= 320
    AND char_length(coalesce(phone, '')) <= 64
    AND (rating IS NULL OR (rating >= 1 AND rating <= 5))
    AND (custom_data IS NULL OR pg_column_size(custom_data) <= 8192)
  );
