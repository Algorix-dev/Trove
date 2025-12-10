-- Migration: Add Bookmarks and Community Tables with Seed Data

-- ============================================
-- BOOKMARKS TABLE (If not exists)
-- ============================================
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete cascade not null,
  page_number integer,
  epub_cfi text,
  progress_percentage float,
  note text,
  title text, -- Optional title for the bookmark
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bookmarks enable row level security;

-- Policies
create policy "Users can view their own bookmarks"
  on bookmarks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own bookmarks"
  on bookmarks for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using ( auth.uid() = user_id );

-- ============================================
-- COMMUNITY TABLES
-- ============================================

-- Communities (Categories)
create table if not exists public.communities (
  id text primary key, -- slug like 'fiction', 'scifi'
  name text not null,
  description text,
  icon_name text, -- Store icon name as string
  color text,
  bg_color text,
  discord_url text,
  member_count integer default 0,
  active_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.communities enable row level security;

-- Policies (Public read, admin write only - assuming manual insert for now)
create policy "Communities are viewable by everyone"
  on communities for select
  using ( true );

-- Review/Social Posts
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  community_id text references public.communities(id) on delete cascade not null,
  content text not null,
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on posts for select
  using ( true );

create policy "Users can insert their own posts"
  on posts for insert
  with check ( auth.uid() = user_id );

-- ============================================
-- INDEXING
-- ============================================
create index if not exists idx_bookmarks_user_book on bookmarks(user_id, book_id);
create index if not exists idx_posts_community on posts(community_id);

-- ============================================
-- SEED DATA
-- ============================================
insert into public.communities (id, name, description, icon_name, color, bg_color, discord_url, member_count, active_count)
values
  ('fiction', 'Fiction Lovers', 'Dive into imaginary worlds, compelling characters, and unforgettable stories.', 'BookOpen', 'text-blue-500', 'bg-blue-500/10', 'https://discord.gg/your-fiction-channel', 2456, 145),
  ('non-fiction', 'Non-Fiction Hub', 'Real stories, biographies, history, and knowledge that expands your mind.', 'Brain', 'text-green-500', 'bg-green-500/10', 'https://discord.gg/your-nonfiction-channel', 1823, 98),
  ('manga-anime', 'Manga & Anime', 'Japanese comics, light novels, and anime adaptations. All things otaku!', 'Sparkles', 'text-pink-500', 'bg-pink-500/10', 'https://discord.gg/your-manga-channel', 3421, 234),
  ('scifi-fantasy', 'Sci-Fi & Fantasy', 'Epic adventures, magical realms, futuristic worlds, and everything speculative.', 'Rocket', 'text-purple-500', 'bg-purple-500/10', 'https://discord.gg/your-scifi-channel', 2891, 167),
  ('self-development', 'Self-Development', 'Personal growth, productivity, mindfulness, and becoming your best self.', 'Palette', 'text-orange-500', 'bg-orange-500/10', 'https://discord.gg/your-selfdev-channel', 1567, 89)
on conflict (id) do nothing;
