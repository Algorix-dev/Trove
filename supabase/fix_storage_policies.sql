-- Note: Storage RLS is usually enabled by default. We will skip enabling it to avoid permission errors.
-- We will just create the policies.

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can upload own book files" on storage.objects;
drop policy if exists "Users can view own book files" on storage.objects;
drop policy if exists "Users can update own book files" on storage.objects;
drop policy if exists "Users can delete own book files" on storage.objects;

-- Policy: Users can upload their own files to 'books' bucket
create policy "Users can upload own book files"
on storage.objects for insert
with check (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Policy: Users can view their own files
create policy "Users can view own book files"
on storage.objects for select
using (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Policy: Users can update their own files
create policy "Users can update own book files"
on storage.objects for update
using (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Policy: Users can delete their own files
create policy "Users can delete own book files"
on storage.objects for delete
using (
  bucket_id = 'books' and
  auth.uid() = (storage.foldername(name))[1]::uuid
);
