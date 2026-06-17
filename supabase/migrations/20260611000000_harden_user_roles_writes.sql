-- ============================================================
-- Harden user_roles write policies  (pentest finding H-01)
--
-- PROBLEM
--   The multi-brand migration (20260529000000) re-scoped the write policies
--   of every CONTENT table to has_brand_access(auth.uid(), brand_id), but the
--   write policies on user_roles ITSELF were never updated. They still gated
--   only on has_role(auth.uid(),'admin'), which ignores brand_id entirely.
--   A brand-scoped admin (user_roles.brand_id = a single brand) could therefore,
--   directly via PostgREST, bypassing the invite-user edge function:
--     (a) UPDATE their own row's brand_id to NULL  -> become platform super-admin
--         (the UPDATE policy had a USING clause but NO WITH CHECK, so the
--          resulting row was unconstrained), or
--     (b) INSERT {user_id:<accomplice>, role:'admin', brand_id:<victim brand>}
--         -> plant admins in tenants they do not own.
--   This defeated the entire multi-brand tenant-isolation model.
--
-- FIX
--   Role ASSIGNMENT (INSERT/UPDATE) becomes exclusively the job of the
--   invite-user edge function, which runs with the service_role key and
--   bypasses RLS while enforcing brand scoping in code. We therefore drop the
--   authenticated INSERT and UPDATE policies entirely: with RLS enabled and no
--   permissive policy, direct inserts/updates by end users are denied, but the
--   edge-function path keeps working.
--
--   The admin "User Management" UI removes a role with a direct DELETE
--   (AdminUsers.tsx -> supabase.from('user_roles').delete()), so we keep a
--   brand-SCOPED DELETE policy built on the existing has_brand_access() helper.
--   Because has_brand_access is SECURITY DEFINER it bypasses RLS and does not
--   cause policy self-recursion. Note has_brand_access(caller, NULL) is true
--   ONLY for super-admins, so a brand-scoped admin can neither delete a
--   super-admin (brand_id IS NULL) row nor touch another brand's roles.
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- (Deliberately NO authenticated INSERT/UPDATE policy — see header.)

CREATE POLICY "Brand-scoped admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_brand_access(auth.uid(), brand_id));
