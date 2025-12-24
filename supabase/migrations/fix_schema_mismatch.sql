-- FIX_SCHEMA_MISMATCH.SQL
-- Run this in Supabase SQL Editor to align DB with Frontend Expectation

BEGIN;

-- 1. Create 'bookmarks' table if not exists (missing in master_setup)
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

-- RLS for bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);


-- 2. Create 'book_quotes' table if not exists (missing in master_setup)
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

-- RLS for book_quotes
ALTER TABLE public.book_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.book_quotes;
CREATE POLICY "Users can manage own quotes" ON public.book_quotes FOR ALL USING (auth.uid() = user_id);

-- 3. Fix 'user_achievements' mismatch
-- Frontend expects 'id', 'achievement_id'. Backend has 'achievement_code' as PK.
-- We will add a generated UUID 'id' and 'achievement_id' alias or column if needed.
-- But changing PK is risky. Let's see. 
-- Frontend query: .select('id, achievement_id, achievements(name, description)')
-- Actual table: user_id, achievement_code.
-- We should create a VIEW or alter table to be friendly, OR update frontend.
-- Safer: Alter table to add 'id' and rename 'achievement_code' to 'achievement_id' or add alias column.

-- Let's try to add 'id' as unique and 'achievement_id' as text alias for 'achievement_code'
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_pkey;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS achievement_id TEXT; 

-- Data migration for existing rows (if any)
UPDATE public.user_achievements SET achievement_id = achievement_code WHERE achievement_id IS NULL;

-- 4. Ensure 'books' table has 'progress_percentage' (it should, but just in case)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- 5. Permission Grants just in case
GRANT ALL ON public.bookmarks TO authenticated;
GRANT ALL ON public.book_quotes TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;

COMMIT;
