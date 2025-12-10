"use client"


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookGrid } from "./book-grid"
import { LibrarySearch } from "./library-search"
import { EmptyLibrary } from "./empty-library"
import type { BookWithProgress } from "@/types/database"

interface LibraryContentProps {
    books: BookWithProgress[]
}

export function LibraryContent({ books }: LibraryContentProps) {
    const [filteredBooks, setFilteredBooks] = useState<BookWithProgress[]>(books)
    const router = useRouter()

    // Update state when initial books change (e.g. after router.refresh())
    useEffect(() => {
        setFilteredBooks(books)
    }, [books])

    // Listen for book uploads
    useEffect(() => {
        const handleBookUploaded = () => {

            router.refresh()
        }

        window.addEventListener('book-uploaded', handleBookUploaded)
        return () => window.removeEventListener('book-uploaded', handleBookUploaded)
    }, [router])

    if (books.length === 0) {
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
