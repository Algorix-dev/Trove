-- FIX: RLS & Schema Consistency
-- This final script ensures all RLS policies are correct and columns exist.
-- Run this in Supabase SQL Editor.

BEGIN;

-- 1. Ensure 'books' has updated_at (Critical for 400 error)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- 2. Fix 'reading_progress' 406 Error (likely RLS)
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reading progress" ON public.reading_progress;
CREATE POLICY "Users can manage own reading progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);

-- 3. Fix 'bookmarks' 406 Error (likely RLS)
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

-- 4. Fix 'book_quotes'
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
