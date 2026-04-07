
-- Recreate view with security_invoker to fix the security definer warning
CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker = true)
AS
SELECT id, question_number, question_text, options
FROM public.quiz_questions
ORDER BY question_number;

-- We need anon to be able to read the base table for the view to work with security_invoker
-- But we only want them to read via the view. So instead, let's use security_barrier.
-- Actually, with security_invoker the anon role needs SELECT on quiz_questions too.
-- Better approach: re-add a limited SELECT policy for anon on quiz_questions
-- but they can only see via the view which doesn't include correct_index.
-- Unfortunately RLS can't restrict columns. Let's use a function instead.

-- Drop the view approach - use a security definer function instead
DROP VIEW IF EXISTS public.quiz_questions_public;

-- Create a security definer function that returns only safe columns
CREATE OR REPLACE FUNCTION public.get_quiz_questions()
RETURNS TABLE(id integer, question_number integer, question_text text, options jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, question_number, question_text, options
  FROM public.quiz_questions
  ORDER BY question_number;
$$;
