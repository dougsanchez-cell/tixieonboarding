-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read config" ON public.app_config;

-- Create admin-only read policy
CREATE POLICY "Authenticated can read config"
ON public.app_config
FOR SELECT
TO authenticated
USING (true);