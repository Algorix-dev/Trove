-- Enable RLS
alter table public.profiles enable row level security;

-- Create achievements table
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  code text not null unique, -- e.g., 'WEEKEND_WARRIOR'
  name text not null,
  description text not null,
  icon text, -- lucide icon name
  xp_reward integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_achievements table
create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- Create levels table (static data)
create table if not exists public.levels (
  level integer primary key,
  min_xp integer not null,
  title text not null -- e.g., 'Scholar', 'Bookworm'
);

-- Seed Levels
insert into public.levels (level, min_xp, title) values
(1, 0, 'Novice Reader'),
(2, 500, 'Page Turner'),
(3, 1500, 'Bookworm'),
(4, 3000, 'Scholar'),
(5, 5000, 'Bibliophile'),
(6, 10000, 'Literary Sage')
on conflict (level) do nothing;

-- Seed Achievements
insert into public.achievements (code, name, description, icon, xp_reward) values
('FIRST_BOOK', 'First Steps', 'Finish your first book', 'BookOpen', 500),
('WEEK_WARRIOR', 'Week Warrior', 'Maintain a 7-day reading streak', 'Flame', 1000),
('NOTE_TAKER', 'Note Taker', 'Create 10 notes', 'PenTool', 300),
('NIGHT_OWL', 'Night Owl', 'Read between 12 AM and 4 AM', 'Moon', 400)
on conflict (code) do nothing;

-- Add stats columns to profiles if not exists (or create separate stats table)
alter table public.profiles add column if not exists total_xp integer default 0;
alter table public.profiles add column if not exists current_level integer default 1;
alter table public.profiles add column if not exists current_streak integer default 0;
alter table public.profiles add column if not exists longest_streak integer default 0;
alter table public.profiles add column if not exists last_read_date date;
alter table public.profiles add column if not exists books_read_count integer default 0;

-- RLS
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.levels enable row level security;

create policy "Everything searchable" on public.achievements for select using (true);
create policy "Everything searchable" on public.levels for select using (true);

create policy "Users can view own achievements" on public.user_achievements 
  for select using (auth.uid() = user_id);

-- Only system/triggers should insert user_achievements really, but for client-side unlocking simulation we might allow insert checking uid
create policy "Users can insert own achievements" on public.user_achievements 
  for insert with check (auth.uid() = user_id);
