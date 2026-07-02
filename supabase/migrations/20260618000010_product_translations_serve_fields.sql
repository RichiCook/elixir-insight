-- Add per-language overrides for the "How to Serve" value fields.
-- When a translation row has these filled, BottleQuickFacts shows them
-- instead of the base products.glass / ice / garnish / flavour columns.
ALTER TABLE public.product_translations
  ADD COLUMN IF NOT EXISTS glass    text,
  ADD COLUMN IF NOT EXISTS ice      text,
  ADD COLUMN IF NOT EXISTS garnish  text,
  ADD COLUMN IF NOT EXISTS flavour  text;
