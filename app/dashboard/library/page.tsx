// app/dashboard/library/page.tsx (server component)
import { LibraryContent } from "@/components/features/library/library-content"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: rawBooks } = await supabase
        .from("books")
        .select(`
      id,
      user_id,
      title,
      author,
      cover_url,
      file_url,
      format,
      total_pages,
      created_at,
      reading_progress ( progress_percentage )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const books = (rawBooks || []).map((b: any) => ({
        id: b.id,
        user_id: b.user_id ?? user.id,
        title: b.title ?? "",
        author: b.author ?? "",
        cover_url: b.cover_url ?? null,
        file_url: b.file_url ?? null,
        format: b.format ?? "pdf",
        total_pages: b.total_pages ?? null,
        created_at: b.created_at ?? null,
        // reading_progress may be an array of relations: get first progress
        progress: Array.isArray(b.reading_progress) ? (b.reading_progress[0]?.progress_percentage ?? 0) : (b.reading_progress?.progress_percentage ?? 0),
    }))

    return <LibraryContent books={books} />
}
