-- FIX_MISSING_COLUMNS.SQL
-- Resolves the remaining 400/406 errors by ensuring ALL columns exist.

BEGIN;

-- 1. FIX READING_PROGRESS (Missing 'updated_at' caused 400 error)
ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reading progress" ON public.reading_progress;
CREATE POLICY "Users can manage own reading progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);


-- 2. FIX BOOKS (Ensure 'updated_at' and 'progress_percentage')
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;


-- 3. FIX BOOKMARKS (Resolves 406 error - missing table)
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


-- 4. FIX BOOK_QUOTES (Missing table)
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


-- 5. FIX USER_ACHIEVEMENTS (Schema mismatch)
-- Safely add columns if they don't exist
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_pkey;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS achievement_id TEXT;
-- Migrate data if needed
UPDATE public.user_achievements SET achievement_id = achievement_code WHERE achievement_id IS NULL;


COMMIT;
