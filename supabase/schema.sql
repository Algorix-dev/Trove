-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Create books table
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  file_url text not null,
  cover_url text,
  format text check (format in ('pdf', 'epub')),
  total_pages integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reading_progress table
create table public.reading_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete cascade not null,
  current_page integer default 0,
  progress_percentage float default 0,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

-- Create notes table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete cascade not null,
  content text not null,
  highlight_text text,
  color text default 'yellow',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.notes enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Books policies
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

-- Reading Progress policies
create policy "Users can view their own progress"
  on reading_progress for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own progress"
  on reading_progress for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own progress"
  on reading_progress for update
  using ( auth.uid() = user_id );

-- Notes policies
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

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Buckets Setup (You need to create these buckets in Supabase Dashboard)
-- Bucket: 'books' (private)
-- Bucket: 'covers' (public)

-- Storage Policies (Conceptual - apply in Dashboard)
-- Allow authenticated users to upload to 'books' folder with their user_id
-- Allow authenticated users to read from 'books' folder with their user_id
