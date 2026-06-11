-- ============================================================
-- Cocktail variant lineage — 2026-06-11
--
-- Links a forked collab core cocktail back to the product it was cloned
-- from, so the editor can offer "apply changes to all brands using this
-- cocktail". A cocktail's variant group is:
--     base  = source_product_id ?? id
--     group = {base} ∪ {products WHERE source_product_id = base}
--
-- Requires 20260611000001 (collaboration_cocktails.public_slug) first — the
-- backfill links existing forks via the public-slug alias recorded there.
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS source_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_source_product_idx
  ON public.products(source_product_id);

COMMENT ON COLUMN public.products.source_product_id IS
  'For a forked collab core cocktail: the original product it was cloned from. NULL = this is an original / standalone product.';

-- Backfill: link already-customized core clones to their base product, matched
-- via the public_slug alias on the join row (= the base product''s own slug).
UPDATE public.products p
SET source_product_id = base.id
FROM public.collaboration_cocktails cc
JOIN public.products base
  ON base.slug = cc.public_slug
 AND base.collaboration_id IS NULL
WHERE cc.product_id = p.id
  AND cc.public_slug IS NOT NULL
  AND p.source_product_id IS NULL
  AND base.id <> p.id;
