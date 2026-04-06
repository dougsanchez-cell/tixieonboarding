
-- Create contractors table
CREATE TABLE public.contractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'cleared', 'failed')),
  quiz_score INTEGER,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contractors" ON public.contractors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read contractors" ON public.contractors FOR SELECT USING (true);
CREATE POLICY "Anyone can update contractors" ON public.contractors FOR UPDATE USING (true);

-- Create content_modules table
CREATE TABLE public.content_modules (
  id SERIAL PRIMARY KEY,
  module_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  abbr TEXT NOT NULL,
  accent TEXT,
  light TEXT,
  duration TEXT,
  video_url TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read modules" ON public.content_modules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update modules" ON public.content_modules FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert modules" ON public.content_modules FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id SERIAL PRIMARY KEY,
  question_number INTEGER NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update quiz" ON public.quiz_questions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert quiz" ON public.quiz_questions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create app_config table
CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update config" ON public.app_config FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert config" ON public.app_config FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_content_modules_updated_at BEFORE UPDATE ON public.content_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
