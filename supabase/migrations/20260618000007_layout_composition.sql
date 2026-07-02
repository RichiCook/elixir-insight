-- ============================================================
-- Layout: ingredients + nutritional passport before How to Serve;
-- composition becomes data-driven & hidden by default — 2026-06-18
--
-- 1. Clear Negroni's composition list (the only product carrying composition
--    data) so it's empty like every other product.
-- 2. Default layout: group Ingredients + Nutritional Passport immediately
--    before "How to Serve" (quick_facts), and hide the Composition block.
-- 3. Apply the same Ingredients/Nutrition reorder to every existing product so
--    customised pages (e.g. Cosmopolitan) match the new standard.
--
-- Composition still appears automatically wherever composition data exists
-- (see BottlePage data-driven guard) — hiding it only affects the empty case.
-- ============================================================

-- 1. Empty Negroni's composition list.
DELETE FROM public.product_composition
WHERE product_id IN (SELECT id FROM public.products WHERE slug = 'negroni');

-- 2. Default layout (Classy brand): reorder + hide composition.
DO $$
DECLARE v_brand uuid;
BEGIN
  SELECT id INTO v_brand FROM public.brands WHERE slug = 'classy';
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Classy brand not found'; END IF;

  -- Move Nutritional Passport up next to Ingredients, just before How to Serve.
  UPDATE public.default_layout_sections SET sort_order = 4 WHERE brand_id = v_brand AND section_key = 'nutrition';
  UPDATE public.default_layout_sections SET sort_order = 5 WHERE brand_id = v_brand AND section_key = 'quick_facts';
  UPDATE public.default_layout_sections SET sort_order = 6 WHERE brand_id = v_brand AND section_key = 'crafted_with';

  -- Composition hidden by default (data-driven on the consumer page).
  UPDATE public.default_layout_sections SET is_visible = false WHERE brand_id = v_brand AND section_key = 'composition';
END $$;

-- 3. Existing products: move Ingredients + Nutritional Passport to immediately
--    before How to Serve, preserving the relative order of everything else.
WITH qf AS (
  SELECT product_id, sort_order AS qf_order
  FROM public.product_sections
  WHERE section_key = 'quick_facts'
),
ranked AS (
  SELECT ps.id, ps.product_id,
    CASE ps.section_key
      WHEN 'ingredients' THEN qf.qf_order - 0.2
      WHEN 'nutrition'   THEN qf.qf_order - 0.1
      ELSE ps.sort_order::numeric
    END AS okey
  FROM public.product_sections ps
  JOIN qf ON qf.product_id = ps.product_id
),
renum AS (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY okey, id) - 1) AS new_order
  FROM ranked
)
UPDATE public.product_sections ps
SET sort_order = renum.new_order
FROM renum
WHERE ps.id = renum.id;
