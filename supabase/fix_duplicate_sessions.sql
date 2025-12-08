-- Fix for reading session duplicates
-- This prevents creating multiple session records per minute

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_duplicate_sessions ON reading_sessions;
DROP FUNCTION IF EXISTS check_duplicate_session();

-- Create function to check for duplicate sessions
CREATE OR REPLACE FUNCTION check_duplicate_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a session already exists for this user, book, and date
    IF EXISTS (
        SELECT 1 FROM reading_sessions
        WHERE user_id = NEW.user_id
        AND book_id = NEW.book_id
        AND session_date = NEW.session_date
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        -- Update existing session instead of creating new one
        UPDATE reading_sessions
        SET duration_minutes = duration_minutes + NEW.duration_minutes,
            created_at = NOW()
        WHERE user_id = NEW.user_id
        AND book_id = NEW.book_id
        AND session_date = NEW.session_date
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        
        -- Prevent the insert
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
CREATE TRIGGER prevent_duplicate_sessions
    BEFORE INSERT ON reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_session();
