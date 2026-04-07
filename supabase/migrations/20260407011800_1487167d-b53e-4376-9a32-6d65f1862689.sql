
-- 1. Create a public view that hides correct_index and explanation
CREATE OR REPLACE VIEW public.quiz_questions_public AS
SELECT id, question_number, question_text, options
FROM public.quiz_questions
ORDER BY question_number;

-- Grant access to the view
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- 2. Restrict the base quiz_questions table: drop the public read policy
DROP POLICY IF EXISTS "Anyone can read quiz questions" ON public.quiz_questions;

-- Only authenticated (admin) can read full quiz data including answers
CREATE POLICY "Authenticated can read quiz questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (true);

-- 3. Fix contractors table: drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can read contractors" ON public.contractors;
DROP POLICY IF EXISTS "Authenticated users can update contractors" ON public.contractors;

-- Admin-only read (all authenticated users are admins in this app)
CREATE POLICY "Admin can read contractors"
ON public.contractors FOR SELECT
TO authenticated
USING (true);

-- No direct UPDATE policy for contractors - all updates go through edge function with service role
