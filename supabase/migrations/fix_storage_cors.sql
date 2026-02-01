-- ==========================================
-- SUPABASE STORAGE CORS FIX
-- ==========================================
-- Run this in the Supabase SQL Editor to allow the frontend 
-- to fetch books from the private bucket.

-- Note: Replace '*' with your actual production domain for better security later.

insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do update
set public = false;

-- This function helps set CORS. 
-- In many Supabase versions, CORS is managed via the UI but this script
-- provides the standard hardening for the bucket.

-- Ensure the 'books' bucket exists and is private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'books';

-- Instructions for the User:
-- 1. Go to Supabase Dashboard -> Storage -> Settings
-- 2. Find CORS Configuration
-- 3. Add a new rule:
--    - Allowed Origins: * (or your domain)
--    - Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
--    - Allowed Headers: *
--    - Expose Headers: Content-Length, Content-Type, Content-Disposition
--    - Max Age: 3600
