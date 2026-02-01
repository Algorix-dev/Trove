-- ==========================================
-- SUPABASE SECURITY HARDENING MIGRATION
-- ==========================================
-- This script addresses:
-- 1. Missing Row Level Security (RLS) on tables
-- 2. Missing RLS policies on tables
-- 3. Mutable search_path in functions (Security Vulnerability)

BEGIN;

-- 1. ENABLE RLS ON MISSING TABLES
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
-- Notes and others were enabled but lacked policies

-- 2. ADD / REPAIR RLS POLICIES

-- ACHIEVEMENTS & LEVELS: Publicly readable, admin only write
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Levels are viewable by everyone" ON public.levels;
CREATE POLICY "Levels are viewable by everyone" ON public.levels FOR SELECT USING (true);

-- COMMUNITY MEMBERS: Viewable by members, managed by admins
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.community_members;
CREATE POLICY "Members are viewable by everyone" ON public.community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POST LIKES: Public read, owner write
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like/unlike posts" ON public.post_likes;
CREATE POLICY "Users can like/unlike posts" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- USER ACHIEVEMENTS: Public read, system/auto write
DROP POLICY IF EXISTS "User achievements are viewable by everyone" ON public.user_achievements;
CREATE POLICY "User achievements are viewable by everyone" ON public.user_achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can claim achievements" ON public.user_achievements;
CREATE POLICY "Users can claim achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- XP HISTORY: Private to user
DROP POLICY IF EXISTS "Users can view own xp history" ON public.xp_history;
CREATE POLICY "Users can view own xp history" ON public.xp_history FOR SELECT USING (auth.uid() = user_id);

-- MARKETPLACE TRANSACTIONS: Buyer and Seller only
DROP POLICY IF EXISTS "Users can view involved transactions" ON public.marketplace_transactions;
CREATE POLICY "Users can view involved transactions" ON public.marketplace_transactions 
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- NOTES: Private by default, public if is_public is true
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public notes are viewable by everyone" ON public.notes;
CREATE POLICY "Public notes are viewable by everyone" ON public.notes FOR SELECT USING (is_public = true);

-- READING SESSIONS: Private to user
DROP POLICY IF EXISTS "Users can manage own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can manage own reading sessions" ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);


-- 3. HARDEN FUNCTIONS (Set explicit search_path)
-- This prevents "role mutable search_path" warnings and security issues.

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.calculate_user_level() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

COMMIT;
