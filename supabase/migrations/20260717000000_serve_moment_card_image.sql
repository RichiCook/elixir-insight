-- Per-card image for serve moments ("The Perfect Occasion" cards).
-- Replaces the fragile positional mapping (nth serve_moment product_image →
-- nth card). Consumer behaviour: if ANY of a product's serve moments has an
-- explicit image_url, only per-card images are used; otherwise the legacy
-- positional mapping still applies (products saved before this feature).
ALTER TABLE public.product_serve_moments
  ADD COLUMN IF NOT EXISTS image_url text;
