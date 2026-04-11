-- 1. Restrict get_user_id_by_email to admin role only
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  RETURN (SELECT id FROM auth.users WHERE email = _email LIMIT 1);
END;
$$;

-- 2. Remove hardcoded admin email from maybe_assign_admin
--    Keep only the domain-based check (already time-limited / expired)
CREATE OR REPLACE FUNCTION public.maybe_assign_admin()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
  _uid uuid;
  _deadline timestamptz := '2026-03-24T00:30:00Z';
BEGIN
  _uid := auth.uid();
  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  IF (_email ILIKE '%@galleriaobjets.com' AND now() < _deadline) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$function$;
