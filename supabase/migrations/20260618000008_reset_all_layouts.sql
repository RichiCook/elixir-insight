-- ============================================================
-- Reset ALL product layouts to the brand default — 2026-06-18
--
-- Clearing product_sections removes every per-product override (custom blocks,
-- content overrides, per-product order/visibility). With no overrides, each
-- product renders the live default_layout_sections via getMergedSections — so
-- this reverts every product to the current default layout.
--
-- CLONE NOTE: one-off data reset. On a fresh clone product_sections is empty,
-- so this is a harmless no-op there.
-- ============================================================

DO $$
DECLARE
  v_rows     int;
  v_products int;
BEGIN
  SELECT count(*), count(DISTINCT product_id) INTO v_rows, v_products
  FROM public.product_sections;

  DELETE FROM public.product_sections;

  RAISE NOTICE 'Reset all layouts: deleted % override rows across % products', v_rows, v_products;
END $$;
