-- ==========================================
-- CONSOLIDATED READER & BOOKMARK FIXES
-- ==========================================
-- This script reconciles schema mismatches that prevent 
-- saving bookmarks and reading progress.

BEGIN;

-- 1. FIX BOOKMARKS TABLE
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Remove duplicates before adding unique constraint using ctid (since MIN doesn't work on UUID)
DELETE FROM public.bookmarks a USING (
    SELECT MIN(ctid) as ctid, user_id, book_id
    FROM public.bookmarks 
    GROUP BY user_id, book_id HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.book_id = b.book_id 
AND a.ctid <> b.ctid;

ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_book_id_user_id_key;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_book_id_user_id_key UNIQUE (book_id, user_id);


-- 2. FIX READING_PROGRESS TABLE
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS epub_cfi TEXT,
ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 0;

-- Remove duplicates before adding unique constraint using ctid
DELETE FROM public.reading_progress a USING (
    SELECT MIN(ctid) as ctid, user_id, book_id
    FROM public.reading_progress 
    GROUP BY user_id, book_id HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.book_id = b.book_id 
AND a.ctid <> b.ctid;

ALTER TABLE public.reading_progress DROP CONSTRAINT IF EXISTS reading_progress_book_id_user_id_key;
ALTER TABLE public.reading_progress ADD CONSTRAINT reading_progress_book_id_user_id_key UNIQUE (book_id, user_id);


-- 3. FIX USER_PREFERENCES TABLE
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS reader_theme TEXT DEFAULT 'light';

COMMIT;
