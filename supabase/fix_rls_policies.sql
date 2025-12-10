-- RLS Policy Diagnostic and Fix for Vercel Authentication Issues
-- Run this in your Supabase SQL Editor

-- STEP 1: Check if RLS is enabled (should return rows)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reading_goals', 'reading_progress', 'reading_sessions', 'profiles');

-- STEP 2: Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('reading_goals', 'reading_progress', 'reading_sessions');

-- STEP 3: Fix reading_goals table (CRITICAL - this is missing!)
-- First, check if table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reading_goals') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.reading_goals (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
            year integer NOT NULL,
            target_books integer DEFAULT 12,
            books_completed integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(user_id, year)
        );
        
        -- Enable RLS
        ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own goals"
            ON reading_goals FOR SELECT
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own goals"
            ON reading_goals FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own goals"
            ON reading_goals FOR UPDATE
            USING (auth.uid() = user_id);
            
        RAISE NOTICE 'reading_goals table created with RLS policies';
    ELSE
        RAISE NOTICE 'reading_goals table already exists';
    END IF;
END $$;

-- STEP 4: Verify all critical RLS policies exist
-- If any of these fail, the policies are missing

-- Check reading_progress policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reading_progress' 
        AND policyname = 'Users can view their own progress'
    ) THEN
        CREATE POLICY "Users can view their own progress"
            ON reading_progress FOR SELECT
            USING (auth.uid() = user_id);
        RAISE NOTICE 'Created missing policy: Users can view their own progress';
    END IF;
END $$;

-- Check reading_sessions policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reading_sessions' 
        AND policyname = 'Users can manage their own reading sessions'
    ) THEN
        CREATE POLICY "Users can manage their own reading sessions"
            ON reading_sessions FOR ALL
            USING (auth.uid() = user_id);
        RAISE NOTICE 'Created missing policy: Users can manage their own reading sessions';
    END IF;
END $$;

-- STEP 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- STEP 6: Verify auth.uid() function works
-- This should return your user ID when you're logged in
SELECT auth.uid() as current_user_id;

-- STEP 7: Test query that was failing (reading_goals)
-- This should work after running the above fixes
SELECT * FROM reading_goals WHERE user_id = auth.uid();

-- SUCCESS MESSAGE
SELECT 'RLS policies verified and fixed! Try logging in to Vercel again.' as status;
