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
  
  IF (
    (_email ILIKE '%@galleriaobjets.com' AND now() < _deadline)
    OR _email = 'riccardo.cook@customix.it'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$function$;