
CREATE OR REPLACE FUNCTION public.check_contractor_email(_email text)
RETURNS TABLE(id uuid, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, status
  FROM public.contractors
  WHERE email = _email
  ORDER BY created_at DESC
  LIMIT 1;
$$;
