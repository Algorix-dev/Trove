-- ==============================================================================
-- ADD READING GOALS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reading_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  target_books INTEGER DEFAULT 12,
  books_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own goals" ON public.reading_goals
  FOR ALL USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_reading_goals_updated_at
  BEFORE UPDATE ON public.reading_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
