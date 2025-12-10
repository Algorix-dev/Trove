import { LibraryContent } from "@/components/features/library/library-content"
import { UploadModal } from "@/components/features/library/upload-modal"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Page is dynamic by default due to cookies usage in createClient

export default async function LibraryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch books with reading progress
    const { data: booksData, error } = await supabase
        .from('books')
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
            reading_progress (
                progress_percentage
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Transform data to include progress percentage
    const books = booksData?.map(book => ({
        ...book,
        reading_progress: undefined, // Remove the nested object
        progress: book.reading_progress?.[0]?.progress_percentage || 0
    })) || []

    console.log(`[LibraryPage] Fetched ${books.length} books for user ${user.id}`)
    if (books.length > 0) {
        console.log('[LibraryPage] First book:', books[0].title)
    } else {
        console.log('[LibraryPage] No books found. Query result:', booksData)
        if (error) {
            console.error('[LibraryPage] DB Error:', error.message, error.details, error.hint)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Library</h2>
                <UploadModal />
            </div>

            <LibraryContent books={books} />
        </div>
    )
}
