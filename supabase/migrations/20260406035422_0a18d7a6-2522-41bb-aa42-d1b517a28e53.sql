
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can insert contractors" ON public.contractors;
DROP POLICY IF EXISTS "Anyone can read contractors" ON public.contractors;
DROP POLICY IF EXISTS "Anyone can update contractors" ON public.contractors;

-- Allow public registration (insert) but only safe fields via defaults
CREATE POLICY "Public can register as contractor"
ON public.contractors FOR INSERT
TO public
WITH CHECK (
  status = 'in_progress'
  AND quiz_score IS NULL
  AND quiz_attempts = 0
  AND completed_at IS NULL
);

-- Only authenticated (admin) can read contractors
CREATE POLICY "Authenticated users can read contractors"
ON public.contractors FOR SELECT
TO authenticated
USING (true);

-- Only authenticated (admin) can update contractors directly
CREATE POLICY "Authenticated users can update contractors"
ON public.contractors FOR UPDATE
TO authenticated
USING (true);
