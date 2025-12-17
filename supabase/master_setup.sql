-- ==============================================================================
-- TROVE 2.0 MASTER DATABASE SETUP (GOATED EDITION)
-- ==============================================================================
-- This script sets up the entire database schema for Trove 2.0.
-- Run this in the Supabase SQL Editor to initialize your project.
--
-- INCLUDES: Profiles, Books, Notes, Gamification, Marketplace (NGN), Community, News
-- ==============================================================================

-- 1. CLEAN SLATE (Safely drop existing tables)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Create user preferences
  INSERT INTO public.user_preferences (user_id) VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. CORE TABLES (Profiles, Preferences)
-- ==============================================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  nickname TEXT,
  full_name TEXT,
  avatar_url TEXT,
  avatar_choice TEXT DEFAULT 'default', -- For preset avatars
  bio TEXT,
  location TEXT,
  website TEXT,
  
  -- Gamification Stats
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  books_read_count INTEGER DEFAULT 0,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  tutorial_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.user_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  favorite_genres TEXT[],
  favorite_books TEXT[],
  reading_goal_minutes INTEGER DEFAULT 30,
  theme_preference TEXT DEFAULT 'system',
  email_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. BOOKS & READING (Library, Notes, Reading Sessions)
-- ==============================================================================

CREATE TABLE public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  file_url TEXT NOT NULL, -- Path in storage
  file_path TEXT NOT NULL, -- Full storage path
  format TEXT NOT NULL CHECK (format IN ('pdf', 'epub', 'txt')),
  size_bytes BIGINT,
  page_count INTEGER,
  total_pages INTEGER DEFAULT 0,
  
  -- Progress
  progress_percentage INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  current_location TEXT, -- EPUB/PDF specific location string
  is_finished BOOLEAN DEFAULT FALSE,
  finished_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  genres TEXT[],
  description TEXT,
  published_year INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);


CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE, -- Can be null for general notes
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow', -- For highlighting
  location_data JSONB, -- Coordinates or CFI range
  is_public BOOLEAN DEFAULT FALSE, -- For sharing in community
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  session_date DATE DEFAULT CURRENT_DATE, -- For easy streak calculation
  pages_read INTEGER DEFAULT 0
);

-- ==============================================================================
-- 5. GAMIFICATION (Levels, Achievements, XP)
-- ==============================================================================

CREATE TABLE public.levels (
  level INTEGER PRIMARY KEY,
  min_xp INTEGER NOT NULL,
  title TEXT NOT NULL,
  icon_url TEXT
);

-- Seed Levels
INSERT INTO public.levels (level, min_xp, title) VALUES
(1, 0, 'Novice Reader'),
(2, 500, 'Beginner'),
(3, 2000, 'Learner'),
(4, 5000, 'Reader'),
(5, 10000, 'Bookworm'),
(6, 15000, 'Bibliophile'),
(7, 25000, 'Scholar'),
(8, 35000, 'Expert'),
(9, 50000, 'Master'),
(10, 75000, 'Grandmaster');

CREATE TABLE public.achievements (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  icon_name TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'streak', 'books_read', 'pages_read', etc
  requirement_value INTEGER NOT NULL
);

-- Seed Achievements
INSERT INTO public.achievements (code, name, description, xp_reward, icon_name, requirement_type, requirement_value) VALUES
('FIRST_BOOK', 'First Steps', 'Read your first book', 50, 'book-open', 'books_read', 1),
('STREAK_3', 'Early Bird', 'Maintain a 3-day reading streak', 100, 'flame', 'streak', 3),
('STREAK_7', 'Week Warrior', 'Maintain a 7-day reading streak', 200, 'zap', 'streak', 7),
('BOOKWORM_10', 'Bookworm', 'Read 10 books', 300, 'library', 'books_read', 10),
('MARATHON_30', 'Marathon Reader', 'Maintain a 30-day streak', 500, 'trophy', 'streak', 30);

CREATE TABLE public.user_achievements (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_code TEXT REFERENCES public.achievements(code) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, achievement_code)
);

CREATE TABLE public.xp_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'reading', 'achievement', 'bonus'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. MARKETPLACE (NGN / Local Support)
-- ==============================================================================

CREATE TABLE public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL, -- Stored in base currency (NGN)
  currency TEXT DEFAULT 'NGN',
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  
  is_sold BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  
  location_city TEXT,
  location_state TEXT,
  delivery_options TEXT[] DEFAULT '{"pickup"}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.marketplace_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_reference TEXT, -- Paystack reference
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'completed', 'disputed'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. COMMUNITY (Social Features)
-- ==============================================================================

CREATE TABLE public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 1,
  
  discord_server_id TEXT, -- For integration
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.community_members (
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.post_likes (
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- ==============================================================================
-- 8. SECURITY POLICIES (RLS)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Preferences: Owner only
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Books: Owner only
CREATE POLICY "Users can view own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- Marketplace: Public read, owner write
CREATE POLICY "Listings are viewable by everyone" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Users can create listings" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own listings" ON public.marketplace_listings FOR DELETE USING (auth.uid() = seller_id);

-- Community: Members read/write
CREATE POLICY "Communities viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Using a simpler policy for posts to avoid recursion limit for now (can be optimized later)
CREATE POLICY "Posts viewable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Members can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 9. TRIGGERS & AUTOMATION
-- ==============================================================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for Level Up (Auto Calculate)
CREATE OR REPLACE FUNCTION public.calculate_user_level()
RETURNS trigger AS $$
DECLARE
  new_level INTEGER;
BEGIN
  SELECT level INTO new_level
  FROM public.levels
  WHERE min_xp <= NEW.total_xp
  ORDER BY level DESC
  LIMIT 1;
  
  IF new_level IS NOT NULL AND new_level != OLD.current_level THEN
    NEW.current_level := new_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_xp_change
  BEFORE UPDATE OF total_xp ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.calculate_user_level();

-- ==============================================================================
-- 10. STORAGE BUCKETS SETUP (Run via Dashboard manually if this fails)
-- ==============================================================================
-- Note: SQL cannot easily create storage buckets directly in all supabase versions,
-- but we can insert into storage.buckets if permissions allow.
-- Best practice: Create 'avatars', 'books', 'covers' in the Dashboard.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true), ('books', 'books', false), ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Cover images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload book covers." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() = owner);

CREATE POLICY "Users can manage their own books." ON storage.objects FOR ALL USING (bucket_id = 'books' AND auth.uid() = owner);
