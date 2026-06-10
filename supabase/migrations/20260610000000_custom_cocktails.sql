-- ============================================================
-- Custom / Collaboration cocktails — 2026-06-10
-- Adds collaboration_cocktails join table for CORE + SIGNATURE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.collaboration_cocktails (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id uuid        NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  product_id       uuid        NOT NULL REFERENCES public.products(id)       ON DELETE CASCADE,
  cocktail_type    text        NOT NULL CHECK (cocktail_type IN ('core', 'signature')),
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collaboration_id, product_id)
);

CREATE INDEX collaboration_cocktails_collab_idx ON public.collaboration_cocktails (collaboration_id, sort_order);
CREATE INDEX collaboration_cocktails_product_idx ON public.collaboration_cocktails (product_id);

ALTER TABLE public.collaboration_cocktails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read collaboration_cocktails"
  ON public.collaboration_cocktails FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins manage collaboration_cocktails"
  ON public.collaboration_cocktails FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
