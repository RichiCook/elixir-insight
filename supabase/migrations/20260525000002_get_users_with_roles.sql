-- Returns all users that have at least one role, with their email and roles array.
-- Admin-only: raises if caller is not an admin.
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (user_id uuid, email text, roles app_role[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    au.email::text,
    array_agg(ur.role ORDER BY ur.role) AS roles
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  GROUP BY ur.user_id, au.email
  ORDER BY au.email;
END;
$$;
