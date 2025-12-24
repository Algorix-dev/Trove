-- FIX_FINAL_SCHEMA.SQL
-- Consolidated fixes for all reported 400/404 errors.
-- Run this in Supabase SQL Editor.

BEGIN;

-- 1. FIX BOOKS TABLE
-- Error: "column books.updated_at does not exist"
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- 2. FIX USER_ACHIEVEMENTS
-- Frontend expects 'id' and 'achievement_id'
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_pkey;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS achievement_id TEXT;
UPDATE public.user_achievements SET achievement_id = achievement_code WHERE achievement_id IS NULL;

-- 3. CREATE BOOKMARKS TABLE (if missing)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER,
    epub_cfi TEXT,
    progress_percentage INTEGER,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- 4. CREATE BOOK_QUOTES TABLE (if missing)
CREATE TABLE IF NOT EXISTS public.book_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    quote_text TEXT NOT NULL,
    page_number INTEGER,
    chapter TEXT,
    note TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.book_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.book_quotes;
CREATE POLICY "Users can manage own quotes" ON public.book_quotes FOR ALL USING (auth.uid() = user_id);

COMMIT;
