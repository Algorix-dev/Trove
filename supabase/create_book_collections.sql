-- Book Collections/Shelves Feature
-- Run this in Supabase SQL Editor

-- Create collections table
CREATE TABLE IF NOT EXISTS public.book_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    color TEXT DEFAULT '#8B5CF6',
    icon TEXT DEFAULT 'bookmark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create collection_books junction table
CREATE TABLE IF NOT EXISTS public.collection_books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.book_collections ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(collection_id, book_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.book_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_collection ON public.collection_books(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_book ON public.collection_books(book_id);

-- Enable RLS
ALTER TABLE public.book_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_collections
CREATE POLICY "Users can view their own collections" 
    ON public.book_collections 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" 
    ON public.book_collections 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
    ON public.book_collections 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" 
    ON public.book_collections 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for collection_books
CREATE POLICY "Users can view their collection books" 
    ON public.collection_books 
    FOR SELECT 
    USING (
        collection_id IN (
            SELECT id FROM public.book_collections WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add books to their collections" 
    ON public.collection_books 
    FOR INSERT 
    WITH CHECK (
        collection_id IN (
            SELECT id FROM public.book_collections WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove books from their collections" 
    ON public.collection_books 
    FOR DELETE 
    USING (
        collection_id IN (
            SELECT id FROM public.book_collections WHERE user_id = auth.uid()
        )
    );

-- Create default collections for existing users
INSERT INTO public.book_collections (user_id, name, description, is_default, color, icon)
SELECT DISTINCT user_id, 'Want to Read', 'Books you plan to read', true, '#3B82F6', 'bookmark'
FROM public.books
ON CONFLICT DO NOTHING;

INSERT INTO public.book_collections (user_id, name, description, is_default, color, icon)
SELECT DISTINCT user_id, 'Currently Reading', 'Books you are reading now', true, '#10B981', 'book-open'
FROM public.books
ON CONFLICT DO NOTHING;

INSERT INTO public.book_collections (user_id, name, description, is_default, color, icon)
SELECT DISTINCT user_id, 'Finished', 'Books you have completed', true, '#8B5CF6', 'check-circle'
FROM public.books
ON CONFLICT DO NOTHING;
