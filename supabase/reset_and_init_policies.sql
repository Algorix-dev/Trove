-- ============================================
-- MASTER POLICY RESET SCRIPT
-- ============================================

-- 1. Enable RLS on all tables (Safety check)
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.notes enable row level security;
alter table public.levels enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.xp_history enable row level security;

-- 2. DROP ALL EXISTING POLICIES
-- We drop by name to be thorough. If you have custom policies not listed here, you might need to drop them manually.
-- Common names are handled below.

drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

drop policy if exists "Users can view their own books" on books;
drop policy if exists "Users can insert their own books" on books;
drop policy if exists "Users can update their own books" on books;
drop policy if exists "Users can delete their own books" on books;

drop policy if exists "Users can view their own progress" on reading_progress;
drop policy if exists "Users can insert their own progress" on reading_progress;
drop policy if exists "Users can update their own progress" on reading_progress;

drop policy if exists "Users can manage their own reading sessions" on reading_sessions;

drop policy if exists "Users can view their own notes" on notes;
drop policy if exists "Users can insert their own notes" on notes;
drop policy if exists "Users can update their own notes" on notes;
drop policy if exists "Users can delete their own notes" on notes;

drop policy if exists "Levels are viewable by everyone" on levels;
drop policy if exists "Achievements are viewable by everyone" on achievements;
drop policy if exists "Users can view their own achievements" on user_achievements;
drop policy if exists "Users can view their own XP history" on xp_history;

-- Drop Storage Policies (from previous fixes)
drop policy if exists "Users can upload own book files" on storage.objects;
drop policy if exists "Users can view own book files" on storage.objects;
drop policy if exists "Users can update own book files" on storage.objects;
drop policy if exists "Users can delete own book files" on storage.objects;
-- Drop any generic ones potentially created
drop policy if exists "Give users access to own folder 1ok12c_0" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12c_1" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12c_2" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12c_3" on storage.objects;

-- 3. CREATE NEW POLICIES

-- PROFILES
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- BOOKS
create policy "Users can view their own books"
  on books for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own books"
  on books for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own books"
  on books for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own books"
  on books for delete
  using ( auth.uid() = user_id );

-- READING PROGRESS
create policy "Users can view their own progress"
  on reading_progress for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own progress"
  on reading_progress for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own progress"
  on reading_progress for update
  using ( auth.uid() = user_id );

-- READING SESSIONS
create policy "Users can manage their own reading sessions"
  on reading_sessions for all
  using ( auth.uid() = user_id );

-- NOTES
create policy "Users can view their own notes"
  on notes for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own notes"
  on notes for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own notes"
  on notes for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own notes"
  on notes for delete
  using ( auth.uid() = user_id );

-- GAMIFICATION
create policy "Levels are viewable by everyone"
  on levels for select
  using ( true );

create policy "Achievements are viewable by everyone"
  on achievements for select
  using ( true );

create policy "Users can view their own achievements"
  on user_achievements for select
  using ( auth.uid() = user_id );

create policy "Users can view their own XP history"
  on xp_history for select
  using ( auth.uid() = user_id );

-- STORAGE (Critical for Uploads)
-- Bucket: 'books'
-- Structure: user_id/filename

create policy "Users can upload own book files"
on storage.objects for insert
with check (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);

create policy "Users can view own book files"
on storage.objects for select
using (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);

create policy "Users can update own book files"
on storage.objects for update
using (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);

create policy "Users can delete own book files"
on storage.objects for delete
using (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);
