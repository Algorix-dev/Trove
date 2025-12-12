// app/dashboard/quotes/page.tsx
import { QuotesList } from "@/components/features/quotes/quotes-list"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function QuotesPage() {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: rawQuotes } = await supabase
        .from("book_quotes")
        .select(`
      id,
      quote_text,
      page_number,
      page_ref,
      chapter,
      note,
      is_favorite,
      created_at,
      books ( id, title, author )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const quotes = (rawQuotes || []).map((q: any) => ({
        id: q.id,
        quote_text: q.quote_text ?? "",
        page_number: q.page_number ?? q.page_ref ?? null,
        chapter: q.chapter ?? null,
        note: q.note ?? null,
        is_favorite: !!q.is_favorite,
        created_at: q.created_at,
        books: Array.isArray(q.books) ? q.books[0] ?? null : q.books ?? null
    }))

    return <QuotesList userId={user.id} quotes={quotes} />
}
