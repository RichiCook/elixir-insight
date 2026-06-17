-- ============================================================
-- Security: lock down anon-callable admin/PII functions — 2026-06-17
--   L-02: remove the dead maybe_assign_admin() self-promotion function
--   L-05: revoke anon/public EXECUTE on the PII-returning admin RPCs
-- No app impact: the admin UI calls these via an authenticated session,
-- which keeps EXECUTE. The in-body has_role() checks remain as a second layer.
-- ============================================================

-- L-02 — drop the inert (deadline-expired) admin self-grant function.
-- It has no DB callers; only a generated TypeScript stub references it.
DROP FUNCTION IF EXISTS public.maybe_assign_admin();

-- L-05 — these read auth.users (emails/UUIDs). Take them off the default
-- PUBLIC grant so anon cannot invoke them at all; authenticated keeps access.
REVOKE EXECUTE ON FUNCTION public.get_users_with_roles()        FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text)    FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_users_with_roles()        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_id_by_email(text)    TO authenticated;
