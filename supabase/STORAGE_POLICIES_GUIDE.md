# 🗄️ Storage Bucket Policies & Setup Guide (Goated Trove)

Since you've created a **new Supabase project**, follow these steps to ensure your books and avatars work perfectly.

---

## 🏗️ Step 1: Create the Buckets

Go to **Storage** in your Supabase Dashboard and create these three buckets:

1.  **`books`**: 
    - **Public**: OFF (Keep it private)
    - **Name**: `books`
2.  **`avatars`**:
    - **Public**: ON (Make it public)
    - **Name**: `avatars`
3.  **`covers`**:
    - **Public**: ON (Make it public)
    - **Name**: `covers`

---

## 🔐 Step 2: Apply Storage Policies (UI Method)

Click on each bucket, go to the **Policies** tab, and create these rules:

### 📗 For the `books` bucket (Private)
| Operation | Policy Name | Policy Definition (Expression) |
| :--- | :--- | :--- |
| **INSERT** | `Users can upload books` | `(storage.foldername(name))[1] = auth.uid()::text` |
| **SELECT** | `Users can view their books` | `(storage.foldername(name))[1] = auth.uid()::text` |
| **UPDATE** | `Users can update their books` | `(storage.foldername(name))[1] = auth.uid()::text` |
| **DELETE** | `Users can delete their books` | `(storage.foldername(name))[1] = auth.uid()::text` |

### 👤 For the `avatars` bucket (Public)
| Operation | Policy Name | Policy Definition (Expression) |
| :--- | :--- | :--- |
| **SELECT** | `Avatar images are public` | `true` |
| **INSERT** | `Users can upload avatars` | `auth.uid() = owner` |
| **UPDATE** | `Users can update own avatar` | `auth.uid() = owner` |

### 🖼️ For the `covers` bucket (Public)
| Operation | Policy Name | Policy Definition (Expression) |
| :--- | :--- | :--- |
| **SELECT** | `Covers are public` | `true` |
| **INSERT** | `Users can upload covers` | `auth.uid() = owner` |

---

## ⚡ Step 3: Fast Check (SQL Editor)

If you prefer using the **SQL Editor**, you can run this block to attempt to create the buckets and policies automatically. 

> [!NOTE]
> If these fail in SQL, please use the UI method above.

```sql
-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true), 
  ('books', 'books', false), 
  ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Avatars Policies
CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- 3. Books Policies
CREATE POLICY "Users can manage own books" ON storage.objects FOR ALL USING (bucket_id = 'books' AND auth.uid() = owner);

-- 4. Covers Policies
CREATE POLICY "Covers are public" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() = owner);
```

---

## 📋 Final Verification Checklist

- [ ] I ran the **`master_setup.sql`** script in the SQL Editor.
- [ ] I updated my **`.env.local`** with the new `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] I created the `books`, `avatars`, and `covers` buckets in the Storage tab.
- [ ] I can see the `profiles` table filled with my user data after logging in.

---
**Trove 2.0 Backend is now fully configured!** 🚀
