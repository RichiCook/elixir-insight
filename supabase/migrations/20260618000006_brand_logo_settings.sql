-- ============================================================
-- Brand logo assets in site settings — 2026-06-18
--
-- Lets an admin upload the official Classy Cocktails logo once (Site Settings →
-- Brand Assets). Every <ClassyWordmark/> across the platform then renders that
-- artwork instead of the text fallback. A separate "on dark" variant is
-- optional — when absent, the standard (dark) logo is auto-inverted to white on
-- dark surfaces (works for the monochrome mark).
-- ============================================================

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS brand_logo_url text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS brand_logo_light_url text;
