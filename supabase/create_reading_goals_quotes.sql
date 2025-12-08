-- Reading Goals Feature
-- Run this in Supabase SQL Editor

-- Create reading goals table
CREATE TABLE IF NOT EXISTS public.reading_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    target_books INTEGER NOT NULL DEFAULT 12,
    books_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, year)
);

-- Create book quotes table
CREATE TABLE IF NOT EXISTS public.book_quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books ON DELETE CASCADE NOT NULL,
    quote_text TEXT NOT NULL,
    page_number INTEGER,
    chapter TEXT,
    note TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reading_goals_user_year ON public.reading_goals(user_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_book_quotes_user_id ON public.book_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_book_quotes_book_id ON public.book_quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_quotes_favorite ON public.book_quotes(is_favorite) WHERE is_favorite = true;

-- Enable RLS
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reading_goals
CREATE POLICY "Users can view their own goals" 
    ON public.reading_goals 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
    ON public.reading_goals 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
    ON public.reading_goals 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
    ON public.reading_goals 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for book_quotes
CREATE POLICY "Users can view their own quotes" 
    ON public.book_quotes 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes" 
    ON public.book_quotes 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" 
    ON public.book_quotes 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" 
    ON public.book_quotes 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create function to auto-increment books_completed
CREATE OR REPLACE FUNCTION update_reading_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.progress_percentage = 100 AND (OLD.progress_percentage IS NULL OR OLD.progress_percentage < 100) THEN
        UPDATE public.reading_goals
        SET books_completed = books_completed + 1,
            updated_at = now()
        WHERE user_id = NEW.user_id 
        AND year = EXTRACT(YEAR FROM now())::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating goals
DROP TRIGGER IF EXISTS trigger_update_reading_goal ON public.reading_progress;
CREATE TRIGGER trigger_update_reading_goal
    AFTER INSERT OR UPDATE ON public.reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_goal_progress();
