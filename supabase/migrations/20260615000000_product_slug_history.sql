-- Keep old product slugs alive after a rename.
--
-- The public bottle URL (/b/:brandSlug/:productSlug) and the QR codes printed on
-- bottles encode a product's slug. When an admin renames a product its slug now
-- changes too, which would 404 any QR code or link using the previous slug.
-- This table records every retired slug so the bottle page can transparently
-- redirect an old slug to the product's current one.

CREATE TABLE IF NOT EXISTS public.product_slug_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_slug   text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_slug_history_product_id_idx
  ON public.product_slug_history (product_id);

ALTER TABLE public.product_slug_history ENABLE ROW LEVEL SECURITY;

-- Public read — required so the consumer bottle page can resolve a retired slug.
DROP POLICY IF EXISTS "Public read product_slug_history" ON public.product_slug_history;
CREATE POLICY "Public read product_slug_history"
  ON public.product_slug_history FOR SELECT USING (true);

-- Writes mirror the products table: only users with access to the product's
-- brand may record or remove slug-history rows.
DROP POLICY IF EXISTS "Brand admins insert product_slug_history" ON public.product_slug_history;
CREATE POLICY "Brand admins insert product_slug_history"
  ON public.product_slug_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id AND public.has_brand_access(auth.uid(), p.brand_id)
  ));

DROP POLICY IF EXISTS "Brand admins update product_slug_history" ON public.product_slug_history;
CREATE POLICY "Brand admins update product_slug_history"
  ON public.product_slug_history FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id AND public.has_brand_access(auth.uid(), p.brand_id)
  ));

DROP POLICY IF EXISTS "Brand admins delete product_slug_history" ON public.product_slug_history;
CREATE POLICY "Brand admins delete product_slug_history"
  ON public.product_slug_history FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id AND public.has_brand_access(auth.uid(), p.brand_id)
  ));
