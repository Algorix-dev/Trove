-- Trove Database Schema Updates
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Add daily goal column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 30;

-- 3. Add streak tracking columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS highest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_read_date DATE;

-- 4. Create reading_sessions table for tracking reading time
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reading_sessions
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading_sessions
CREATE POLICY "Users can manage their own reading sessions"
ON reading_sessions FOR ALL
USING (auth.uid() = user_id);

-- 5. Add updated_at column to reading_progress if it doesn't exist
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date 
ON reading_sessions(user_id, session_date DESC);

-- Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'books', 'reading_progress', 'reading_sessions', 'bookmarks', 'highlights');
