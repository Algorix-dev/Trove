-- ==============================================================================
-- TROVE 2.0 LIBRARY & PROGRESS FIX (GOATED FINAL TOUCH)
-- ==============================================================================
-- Run this in your Supabase SQL Editor to fix the "Failed to fetch book" error.
-- ==============================================================================

-- 1. Add missing column to books
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 0;

-- 2. Create the missing reading_progress table
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, book_id)
);

-- 3. Enable RLS and Policies for progress
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.reading_progress;
CREATE POLICY "Users can manage own progress" ON public.reading_progress 
FOR ALL USING (auth.uid() = user_id);

-- 4. Re-grant permissions (just in case)
GRANT ALL ON TABLE public.reading_progress TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ==============================================================================
-- SUCCESS: Your Library is now fully compatible with the Goated UI!
-- Try uploading your book again!
-- ==============================================================================
