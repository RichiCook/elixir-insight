-- Backfill per-card serve-moment images from the legacy positional pool
-- (nth serve_moment product_image -> nth card), so every existing card owns
-- its photo explicitly. Intentionally ignores the is_approved flag: these
-- images were attached to the section deliberately by admins, and some rows
-- predate the image_attributes flow (e.g. Spritz's box shot has no attributes
-- row at all, which made the consumer page silently drop it).
WITH pool AS (
  SELECT
    pi.product_id,
    bi.public_url,
    ROW_NUMBER() OVER (PARTITION BY pi.product_id ORDER BY pi.sort_order, pi.id) - 1 AS idx
  FROM public.product_images pi
  JOIN public.brand_images bi ON bi.id = pi.image_id
  WHERE pi.section = 'serve_moment' AND bi.public_url IS NOT NULL
),
cards AS (
  SELECT
    id,
    product_id,
    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sort_order, id) - 1 AS idx
  FROM public.product_serve_moments
)
UPDATE public.product_serve_moments m
SET image_url = pool.public_url
FROM cards
JOIN pool ON pool.product_id = cards.product_id AND pool.idx = cards.idx
WHERE m.id = cards.id
  AND m.image_url IS NULL;
