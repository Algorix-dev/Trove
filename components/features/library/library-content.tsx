"use client"

import { useState } from "react"
import { BookGrid } from "./book-grid"
import { LibrarySearch } from "./library-search"
import type { Book, BookWithProgress } from "@/types/database"

interface LibraryContentProps {
    books: BookWithProgress[]
}

export function LibraryContent({ books }: LibraryContentProps) {
    const [filteredBooks, setFilteredBooks] = useState<Book[]>(books as Book[])

    return (
        <>
            <LibrarySearch
                books={books}
                onFilteredChange={setFilteredBooks}
            />
            <BookGrid books={filteredBooks} />
        </>
    )
}
