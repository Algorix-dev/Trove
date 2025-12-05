import { BookGrid } from "@/components/features/library/book-grid"
import { UploadModal } from "@/components/features/library/upload-modal"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LibraryDebugger } from "@/components/debug/library-debugger"

export default async function LibraryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch books with reading progress
    const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

    // Transform data to include progress percentage
    // Transform data (progress currently disabled for debugging)
    const books = booksData?.map(book => ({
        ...book,
        progress: 0
    })) || []

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Library</h2>
                <UploadModal />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search books..." className="pl-8" />
                </div>
                {/* Add filters here later if needed */}
            </div>

            <LibraryDebugger />
            <BookGrid books={books} />
        </div>
    )
}
