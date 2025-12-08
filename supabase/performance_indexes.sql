-- Performance optimization indexes
-- Run this in Supabase SQL Editor

-- Books table indexes
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_format ON public.books(format);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books USING GIN (to_tsvector('english', author));

-- Reading progress indexes
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON public.reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_percentage ON public.reading_progress(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_reading_progress_updated ON public.reading_progress(updated_at DESC);

-- Reading sessions indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON public.reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON public.reading_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_date ON public.reading_sessions(user_id, session_date DESC);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON public.notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_book ON public.bookmarks(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_notified ON public.user_achievements(notified) WHERE notified = false;

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(total_xp DESC);
