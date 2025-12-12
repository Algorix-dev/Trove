"use client"

import { useState, useEffect } from "react"
import { BookGrid } from "./book-grid"
import { LibrarySearch } from "./library-search"
import { EmptyLibrary } from "./empty-library"
import type { BookWithProgress } from "@/types/database"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"

interface LibraryContentProps {
    books: BookWithProgress[]
}

export function LibraryContent({ books: initialBooks }: LibraryContentProps) {
    const { user } = useAuth()
    const [books, setBooks] = useState<BookWithProgress[]>(initialBooks || [])
    const [filteredBooks, setFilteredBooks] = useState<BookWithProgress[]>(initialBooks || [])
    const [loading, setLoading] = useState(false)

    // Allow client refresh after uploads (keeps server-first default)
    useEffect(() => {
        const handleBookUploaded = () => {
            // fetch only if user is present
            if (!user) return
            (async () => {
                setLoading(true)
                try {
                    const supabase = createBrowserSupabaseClient()
                    const { data: booksData } = await supabase
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
              reading_progress ( progress_percentage )
            `)
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })

                    const transformedBooks = (booksData || []).map((book: any) => ({
                        ...book,
                        reading_progress: undefined,
                        progress: book.reading_progress?.[0]?.progress_percentage || 0
                    }))

                    setBooks(transformedBooks)
                    setFilteredBooks(transformedBooks)
                } catch (err) {
                    console.error("Library refresh failed", err)
                } finally {
                    setLoading(false)
                }
            })()
        }
        window.addEventListener('book-uploaded', handleBookUploaded)
        return () => window.removeEventListener('book-uploaded', handleBookUploaded)
    }, [user])

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!books || books.length === 0) {
        return <EmptyLibrary />
    }

    return (
        <div className="space-y-6">
            <LibrarySearch
                books={books}
                onFilteredChange={(filtered) => setFilteredBooks(filtered as BookWithProgress[])}
            />
            {filteredBooks.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-lg text-muted-foreground mb-2">No books match your search</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </div>
            ) : (
                <BookGrid books={filteredBooks} />
            )}
        </div>
    )
}
