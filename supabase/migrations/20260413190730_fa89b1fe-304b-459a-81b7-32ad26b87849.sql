CREATE TABLE public.session_events (
  id SERIAL PRIMARY KEY,
  contractor_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert session events" ON public.session_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read session events" ON public.session_events FOR SELECT TO authenticated USING (true);

-- Validation trigger for event_type
CREATE OR REPLACE FUNCTION public.validate_session_event_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN ('enter', 'exit') THEN
    RAISE EXCEPTION 'event_type must be enter or exit';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_session_event_type
BEFORE INSERT OR UPDATE ON public.session_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_session_event_type();