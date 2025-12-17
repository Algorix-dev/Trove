# Trove Database Setup

This directory contains the SQL script for setting up your Trove database.

## 🚀 Quick Setup

### For Fresh Database (Recommended)

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Click "New Query"**
3. **Open `setup_database.sql`** in this directory
4. **Copy the entire contents**
5. **Paste into Supabase SQL Editor**
6. **Click "Run"** (or press Ctrl+Enter)

That's it! This single file creates:
- ✅ All tables (profiles, books, reading_progress, notes, bookmarks, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Gamification tables (levels, achievements, XP)
- ✅ Triggers and functions
- ✅ Seed data (initial levels and achievements)

## 📦 Next Steps

After running the SQL script:

1. **Create Storage Bucket:**
   - Go to Supabase Dashboard → Storage
   - Create a bucket named `books` (private)
   - **Important:** Storage policies must be created via Dashboard UI (not SQL)
   - See `STORAGE_POLICIES_GUIDE.md` for detailed policy setup instructions

2. **Configure Environment Variables:**
   - Create `.env.local` in your project root
   - Add your Supabase credentials

## 📋 Files in This Directory

- **`master_setup.sql`** - Complete database setup (run this!)
- **`STORAGE_POLICIES_GUIDE.md`** - Guide for setting up storage policies
- **`README.md`** - This file

## ✅ Verification

After running the script, verify in Supabase Dashboard → Table Editor:

You should see these tables:
- `profiles`
- `books`
- `notes`
- `reading_sessions`
- `levels`
- `achievements`
- `user_achievements`
- `xp_history`
- `marketplace_listings`
- `communities`
- `community_posts`

## 🆘 Troubleshooting

**Error: "relation already exists"**
- Some tables might already exist. The script uses `CREATE TABLE IF NOT EXISTS` so it should be safe to run again.

**Error: "permission denied"**
- Make sure you're running the script in the SQL Editor with proper permissions.

**Missing tables after running**
- Check the SQL Editor output for any errors
- Verify you copied the entire file contents

---

**That's it!** Your database is ready. 🎉
