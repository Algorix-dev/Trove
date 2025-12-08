-- Streak Calculation and Level-Up Logic
-- Run this in Supabase SQL Editor

-- Function to calculate and update user streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_session_date DATE;
    current_date DATE := CURRENT_DATE;
    new_streak INTEGER := 1;
BEGIN
    -- Get the most recent session date before today
    SELECT session_date INTO last_session_date
    FROM reading_sessions
    WHERE user_id = NEW.user_id
    AND session_date < current_date
    ORDER BY session_date DESC
    LIMIT 1;

    -- If there was a session yesterday, increment streak
    IF last_session_date = current_date - INTERVAL '1 day' THEN
        SELECT current_streak + 1 INTO new_streak
        FROM profiles
        WHERE id = NEW.user_id;
    -- If there was a session today already, keep current streak
    ELSIF EXISTS (
        SELECT 1 FROM reading_sessions
        WHERE user_id = NEW.user_id
        AND session_date = current_date
        AND id != NEW.id
    ) THEN
        SELECT current_streak INTO new_streak
        FROM profiles
        WHERE id = NEW.user_id;
    -- Otherwise reset to 1
    ELSE
        new_streak := 1;
    END IF;

    -- Update profile with new streak
    UPDATE profiles
    SET current_streak = new_streak,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS trigger_update_streak ON reading_sessions;
CREATE TRIGGER trigger_update_streak
    AFTER INSERT ON reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
BEGIN
    -- Calculate new level based on total XP
    SELECT level INTO new_level
    FROM levels
    WHERE min_xp <= NEW.total_xp
    ORDER BY min_xp DESC
    LIMIT 1;

    -- Update current level if it changed
    IF new_level IS NOT NULL AND new_level != NEW.current_level THEN
        NEW.current_level := new_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level updates
DROP TRIGGER IF EXISTS trigger_update_level ON profiles;
CREATE TRIGGER trigger_update_level
    BEFORE UPDATE OF total_xp ON profiles
    FOR EACH ROW
    WHEN (OLD.total_xp IS DISTINCT FROM NEW.total_xp)
    EXECUTE FUNCTION update_user_level();

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
DECLARE
    achievement RECORD;
    requirement_met BOOLEAN;
    user_stat INTEGER;
BEGIN
    -- Loop through all achievements
    FOR achievement IN 
        SELECT * FROM achievements
        WHERE id NOT IN (
            SELECT achievement_id FROM user_achievements WHERE user_id = NEW.user_id
        )
    LOOP
        requirement_met := FALSE;

        -- Check different requirement types
        CASE achievement.requirement_type
            WHEN 'books_read' THEN
                SELECT COUNT(*) INTO user_stat
                FROM reading_progress
                WHERE user_id = NEW.user_id AND progress_percentage = 100;
                requirement_met := user_stat >= achievement.requirement_value;

            WHEN 'reading_streak' THEN
                SELECT current_streak INTO user_stat
                FROM profiles
                WHERE id = NEW.user_id;
                requirement_met := user_stat >= achievement.requirement_value;

            WHEN 'total_minutes' THEN
                SELECT COALESCE(SUM(duration_minutes), 0) INTO user_stat
                FROM reading_sessions
                WHERE user_id = NEW.user_id;
                requirement_met := user_stat >= achievement.requirement_value;

            WHEN 'total_xp' THEN
                SELECT total_xp INTO user_stat
                FROM profiles
                WHERE id = NEW.user_id;
                requirement_met := user_stat >= achievement.requirement_value;

            ELSE
                requirement_met := FALSE;
        END CASE;

        -- Unlock achievement if requirement met
        IF requirement_met THEN
            INSERT INTO user_achievements (user_id, achievement_id, notified)
            VALUES (NEW.user_id, achievement.id, FALSE);

            -- Award XP for achievement
            UPDATE profiles
            SET total_xp = total_xp + achievement.xp_reward
            WHERE id = NEW.user_id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for achievement checking
DROP TRIGGER IF EXISTS trigger_check_achievements_on_progress ON reading_progress;
CREATE TRIGGER trigger_check_achievements_on_progress
    AFTER INSERT OR UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_achievements();

DROP TRIGGER IF EXISTS trigger_check_achievements_on_session ON reading_sessions;
CREATE TRIGGER trigger_check_achievements_on_session
    AFTER INSERT ON reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_achievements();
