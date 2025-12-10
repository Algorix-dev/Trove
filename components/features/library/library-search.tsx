"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { Book } from "@/types/database"

interface LibrarySearchProps {
    books: Book[]
    onFilteredChange: (filtered: Book[]) => void
}

type SortOption = 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc' | 'author-asc'
type FormatFilter = 'all' | 'pdf' | 'epub' | 'txt'

export function LibrarySearch({ books, onFilteredChange }: LibrarySearchProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [formatFilter, setFormatFilter] = useState<FormatFilter>("all")
    const [sortBy, setSortBy] = useState<SortOption>("date-desc")
    const [showFilters, setShowFilters] = useState(false)

    // Filter and sort books
    const filteredBooks = useMemo(() => {
        let result = [...books]

        // Search by title or author
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            )
        }

        // Filter by format
        if (formatFilter !== "all") {
            result = result.filter(book => book.format === formatFilter)
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'title-asc':
                    return a.title.localeCompare(b.title)
                case 'title-desc':
                    return b.title.localeCompare(a.title)
                case 'author-asc':
                    return a.author.localeCompare(b.author)
                case 'date-asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case 'date-desc':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                default:
                    return 0
            }
        })

        return result
    }, [books, searchQuery, formatFilter, sortBy])

    // Notify parent of changes
    // Notify parent of changes
    useEffect(() => {
        onFilteredChange(filteredBooks)
    }, [filteredBooks, onFilteredChange])

    const handleClearFilters = () => {
        setSearchQuery("")
        setFormatFilter("all")
        setSortBy("date-desc")
    }

    const hasActiveFilters = searchQuery !== "" || formatFilter !== "all" || sortBy !== "date-desc"

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search books by title or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button
                    variant={showFilters ? "default" : "outline"}
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Format</label>
                        <Select value={formatFilter} onValueChange={(value: FormatFilter) => setFormatFilter(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Formats</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="epub">EPUB</SelectItem>
                                <SelectItem value="txt">TXT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date-desc">Newest First</SelectItem>
                                <SelectItem value="date-asc">Oldest First</SelectItem>
                                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                                <SelectItem value="author-asc">Author (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
                {filteredBooks.length === books.length ? (
                    `Showing all ${books.length} ${books.length === 1 ? 'book' : 'books'}`
                ) : (
                    `Showing ${filteredBooks.length} of ${books.length} ${books.length === 1 ? 'book' : 'books'}`
                )}
            </div>
        </div>
    )
}
