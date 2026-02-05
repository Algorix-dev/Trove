-- ==============================================================================
-- TROVE: MASTER SCHEMA CLEANUP & ENHANCEMENTS (2026-02-05)
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to ensure your database is
-- perfectly synced with the application.
-- ==============================================================================

BEGIN;

-- 1. BASE TABLES & COLUMNS
-- Ensure books table has all needed columns
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS current_location TEXT;

-- 2. READING PROGRESS
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    current_page INTEGER DEFAULT 0,
    epub_cfi TEXT,
    progress_percentage INTEGER DEFAULT 0,
    last_pages JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id)
);
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reading progress" ON public.reading_progress;
CREATE POLICY "Users can manage own reading progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);

-- 3. BOOKMARKS
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER,
    epub_cfi TEXT,
    progress_percentage INTEGER,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- 4. BOOK QUOTES & HIGHLIGHTS
CREATE TABLE IF NOT EXISTS public.book_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    quote_text TEXT NOT NULL,
    page_number INTEGER,
    chapter TEXT,
    note TEXT,
    color TEXT DEFAULT '#fef08a',
    highlight_type TEXT DEFAULT 'highlight', -- 'highlight', 'quote', 'note'
    selection_data JSONB,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.book_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.book_quotes;
CREATE POLICY "Users can manage own quotes" ON public.book_quotes FOR ALL USING (auth.uid() = user_id);

-- 5. READING SESSIONS (For Dashboard Activity)
CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    duration_minutes INTEGER DEFAULT 1,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can manage own reading sessions" ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);

-- 6. READING GOALS
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
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own goals" ON public.reading_goals;
CREATE POLICY "Users can manage own goals" ON public.reading_goals FOR ALL USING (auth.uid() = user_id);

-- 7. GAMIFICATION & ACHIEVEMENTS (Cleanup)
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_pkey;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS achievement_id TEXT;
UPDATE public.user_achievements SET achievement_id = achievement_code WHERE achievement_id IS NULL;

-- 8. UTILITIES & TRIGGERS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_reading_goals_updated_at ON public.reading_goals;
CREATE TRIGGER handle_reading_goals_updated_at
  BEFORE UPDATE ON public.reading_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- HARDEN FUNCTIONS
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.calculate_user_level() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

COMMIT;
