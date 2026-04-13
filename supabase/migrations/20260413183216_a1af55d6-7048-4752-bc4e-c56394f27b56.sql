CREATE OR REPLACE FUNCTION public.get_returning_contractor(_email text)
RETURNS TABLE(id uuid, name text, email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, email, phone
  FROM public.contractors
  WHERE contractors.email = _email
    AND status = 'cleared'
  ORDER BY created_at DESC
  LIMIT 1;
$$;