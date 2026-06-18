-- ============================================================
-- Spirit partners registry — 2026-06-17
--
-- The consumer "Crafted With" block shows each product's spirit partner(s)
-- as text (product.spirit, split on '+'). This table lets an admin attach a
-- logo (and optional website) to each partner name ONCE; it then renders on
-- every product that uses that spirit. Public read, admin write.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.spirit_partners (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  logo_url    text,
  website_url text,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One entry per partner name, case-insensitive (matches how the consumer block
-- looks them up).
CREATE UNIQUE INDEX IF NOT EXISTS spirit_partners_name_lower_idx
  ON public.spirit_partners (lower(name));

ALTER TABLE public.spirit_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read spirit_partners"
  ON public.spirit_partners FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins manage spirit_partners"
  ON public.spirit_partners FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
