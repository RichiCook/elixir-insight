-- ---------------------------------------------------------------------------
-- Sprint 3 — Translatable content
-- Adds a `translations` JSONB column to serve_moments and pairings so that
-- the AI can store per-language overrides without adding new rows or tables.
--
-- Shape: { "IT": { "title": "...", "description": "..." }, "FR": { ... } }
-- ---------------------------------------------------------------------------

-- Serve moments
ALTER TABLE public.product_serve_moments
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Pairings
ALTER TABLE public.product_ai_pairings
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;
