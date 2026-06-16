-- ============================================================
-- Per-line editorial ("Line Story") content — 2026-06-16
--
-- The consumer "Line Story" block (EditorialBlock) showed text hardcoded
-- per product line (Classic / Sparkling / No Regrets). This table makes that
-- copy editable per line + language from the admin "Line Content" page.
-- Seeded with the existing hardcoded copy so nothing changes until edited.
-- Per-product overrides (product_sections.custom_content) still take
-- precedence; the hardcoded values remain only as a final fallback.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.line_editorials (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  line           text        NOT NULL,
  language       text        NOT NULL DEFAULT 'EN',
  line_label     text,
  heading        text,
  heading_accent text,
  body           text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (line, language)
);

ALTER TABLE public.line_editorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read line_editorials"
  ON public.line_editorials FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins manage line_editorials"
  ON public.line_editorials FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.line_editorials (line, language, line_label, heading, heading_accent, body) VALUES
  ('Classic', 'EN', 'Classic Line', 'The Art of the Aperitivo', 'Aperitivo',
   'A moment of pause, of pleasure, of character. Classy Cocktails brings the Italian aperitivo ritual into every glass — crafted, ready, and unforgettable.'),
  ('Sparkling', 'EN', 'Sparkling Line', 'Reinventing the Spritz', 'Spritz',
   'Not your average aperitivo. Natural botanicals, sparkling wine, and a citrus twist — light, lively, genuinely special.'),
  ('No Regrets', 'EN', 'No Regrets Line', 'Genuinely Healthy', 'Healthy',
   'Every ingredient chosen for what it gives you. Reishi mushroom, aronia, ginger. No alcohol. No regrets.')
ON CONFLICT (line, language) DO NOTHING;
