
-- Allow authenticated users to delete contractors
CREATE POLICY "Authenticated users can delete contractors"
ON public.contractors
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to update contractors
CREATE POLICY "Authenticated users can update contractors"
ON public.contractors
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);
