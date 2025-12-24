-- RLS Repair Migration
-- Run this in Supabase SQL Editor to ensure policies are correct

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;

-- 3. Re-create correct policies
-- Allow users to view their own books
CREATE POLICY "Users can view own books" 
ON public.books 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own books (CRITICAL FIX)
CREATE POLICY "Users can insert own books" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own books
CREATE POLICY "Users can update own books" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own books
CREATE POLICY "Users can delete own books" 
ON public.books 
FOR DELETE 
USING (auth.uid() = user_id);

COMMIT;
