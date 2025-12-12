// app/dashboard/notes/page.tsx
import { NotesList } from "@/components/features/notes/notes-list"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function NotesPage() {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: rawNotes } = await supabase
        .from("notes")
        .select("id, content, book_id, page, page_number, highlight_text, color, created_at, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const notes = (rawNotes || []).map((n: any) => ({
        id: n.id,
        content: n.content ?? "",
        user_id: n.user_id ?? user.id,
        book_id: n.book_id ?? null,
        page_number: n.page_number ?? n.page ?? null,
        highlight_text: n.highlight_text ?? null,
        color: n.color ?? null,
        created_at: n.created_at,
    }))

    return <NotesList userId={user.id} notes={notes} />
}
