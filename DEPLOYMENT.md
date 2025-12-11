# Deployment Guide for Trove

## 1. Prerequisites
- GitHub Account (repo pushed)
- Vercel Account
- Supabase Project URL & Anon Key

## 2. Environment Variables
You MUST configure these in your Vercel Project Settings > Environment Variables:

| Variable Name | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Project API Key |

> **Important**: Do not commit `.env.local` to Git. Use the Vercel dashboard.

## 3. Deployment Steps
1.  **Push Code**: Ensure your latest code (with the PDF viewer fix) is pushed to main.
2.  **Import to Vercel**:
    - Go to https://vercel.com/new
    - Select your `trove` repository.
    - Framework Preset: `Next.js` (default)
    - Root Directory: `./` (default)
3.  **Add Environment Variables**: Paste the values from your Supabase dashboard.
4.  **Deploy**: Click "Deploy".

## 4. Verification
After deployment, verify:
- **Login**: Auth flow redirects correctly.
- **PDF Viewer**: Open a book. If it crashes, verify `pdfjs-dist` version is exactly `4.4.168` in `package.json`.
