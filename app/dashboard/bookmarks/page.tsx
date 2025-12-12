// app/dashboard/bookmarks/page.tsx (server component)
import { BookmarksList } from "@/components/features/bookmarks/bookmarks-list"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function BookmarksPage() {
    const supabase = createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch bookmarks with book relation
    const { data: rawBookmarks } = await supabase
        .from("bookmarks")
        .select(`
      id,
      book_id,
      page_number,
      epub_cfi,
      progress_percentage,
      created_at,
      note,
      books (
        id,
        title,
        author,
        cover_url,
        format
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const bookmarks = (rawBookmarks || []).map((b: any) => ({
        id: b.id,
        book_id: b.book_id,
        page_number: b.page_number ?? null,
        epub_cfi: b.epub_cfi ?? null,
        progress_percentage: b.progress_percentage ?? null,
        created_at: b.created_at,
        note: b.note ?? null,
        // Normalize relation: sometimes Supabase returns array for relation; ensure object
        books: Array.isArray(b.books) ? b.books[0] ?? null : b.books ?? null,
    }))

    return <BookmarksList userId={user.id} bookmarks={bookmarks} />
}
