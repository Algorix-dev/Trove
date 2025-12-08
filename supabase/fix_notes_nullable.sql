-- Fix notes table to allow general notes (not linked to a specific book)
-- Run this in your Supabase SQL Editor

ALTER TABLE public.notes ALTER COLUMN book_id DROP NOT NULL;
