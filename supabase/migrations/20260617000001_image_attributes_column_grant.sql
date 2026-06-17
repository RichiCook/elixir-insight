-- ============================================================
-- Security L-04: column-mask image_attributes for anon — 2026-06-17
--
-- The "Public read approved image_attributes" RLS policy is row-level only,
-- so anon could read every column of approved rows — including internal-only
-- AI metadata (internal_notes, scene_description, cocktails_present, mood,
-- composition, …). Replace the broad table grant with a column-level grant
-- limited to the public display fields. Admins (authenticated) are unaffected,
-- and the bottle-page RPC is SECURITY DEFINER so it keeps full access.
-- ============================================================

REVOKE SELECT ON TABLE public.image_attributes FROM anon;

GRANT SELECT (id, image_id, is_approved, is_featured, alt_text_en, alt_text_it)
  ON TABLE public.image_attributes TO anon;
