-- Migration: 20260204_enhancements.sql
-- Goal: Add support for highlights, colors, and reader history.

BEGIN;

-- 1. Update book_quotes to support highlights better
ALTER TABLE public.book_quotes ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#fef08a'; -- Default yellow
ALTER TABLE public.book_quotes ADD COLUMN IF NOT EXISTS highlight_type TEXT DEFAULT 'highlight'; -- 'highlight' or 'quote'
ALTER TABLE public.book_quotes ADD COLUMN IF NOT EXISTS selection_data JSONB; -- Store coordinate/offset data if needed for precise highlighting

-- 2. Update reading_progress to store recently visited pages
ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS last_pages JSONB DEFAULT '[]'::jsonb;

-- 3. Ensure books table has last_read_at if not already there (it should be)
-- Done in previous migrations but double checking.

COMMIT;
