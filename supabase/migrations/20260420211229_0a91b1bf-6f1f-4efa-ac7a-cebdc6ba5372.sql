CREATE OR REPLACE FUNCTION public.get_returning_contractor(_email text)
 RETURNS TABLE(id uuid, name text, email text, phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, name, email, phone
  FROM public.contractors
  WHERE LOWER(contractors.email) = LOWER(TRIM(_email))
    AND status = 'cleared'
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.check_contractor_email(_email text)
 RETURNS TABLE(id uuid, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, status
  FROM public.contractors
  WHERE LOWER(email) = LOWER(TRIM(_email))
  ORDER BY created_at DESC
  LIMIT 1;
$function$;