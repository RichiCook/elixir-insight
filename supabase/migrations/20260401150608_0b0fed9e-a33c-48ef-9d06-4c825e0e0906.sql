-- Retroactively link all analyzed images to their products based on image_attributes
-- For images with best_for_sections populated
INSERT INTO public.product_images (product_id, image_id, section, sort_order)
SELECT p.id, ia.image_id, unnest(
  CASE WHEN ia.best_for_sections IS NOT NULL AND array_length(ia.best_for_sections, 1) > 0 
       THEN ia.best_for_sections 
       ELSE ARRAY['gallery'] 
  END
), 0
FROM public.image_attributes ia
CROSS JOIN LATERAL unnest(ia.product_slugs) AS ps(slug)
JOIN public.products p ON p.slug = ps.slug
WHERE ia.product_slugs IS NOT NULL 
  AND array_length(ia.product_slugs, 1) > 0
ON CONFLICT (product_id, image_id, section) DO NOTHING;