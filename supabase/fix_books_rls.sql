-- Check and fix RLS policies for books table

-- First, check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'books';

-- Enable RLS if not enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own books" ON books;
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;

-- Create comprehensive RLS policies for books table
CREATE POLICY "Users can view their own books"
ON books FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books"
ON books FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
ON books FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
ON books FOR DELETE
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'books';
