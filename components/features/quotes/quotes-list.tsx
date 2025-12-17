"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Quote, Star, Trash2, BookOpen } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface BookQuote {
    id: string
    quote_text: string
    page_number: number | null
    chapter: string | null
    note: string | null
    is_favorite: boolean
    created_at: string
    books: {
        id: string
        title: string
        author: string
    }
}

export function QuotesList({ userId }: { userId: string }) {
    const [quotes, setQuotes] = useState<BookQuote[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'favorites'>('all')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchQuotes()
    }, [userId])

    const fetchQuotes = async () => {
        const { data } = await supabase
            .from('book_quotes')
            .select(`
                id,
                quote_text,
                page_number,
                chapter,
                note,
                is_favorite,
                created_at,
                books (
                    id,
                    title,
                    author
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (data) {
            setQuotes(data as any)
        }
        setLoading(false)
    }

    const toggleFavorite = async (quoteId: string, currentFavorite: boolean) => {
        const { error } = await supabase
            .from('book_quotes')
            .update({ is_favorite: !currentFavorite })
            .eq('id', quoteId)

        if (error) {
            toast.error("Failed to update favorite")
        } else {
            setQuotes(quotes.map(q =>
                q.id === quoteId ? { ...q, is_favorite: !currentFavorite } : q
            ))
            toast.success(currentFavorite ? "Removed from favorites" : "Added to favorites")
        }
    }

    const deleteQuote = async (quoteId: string) => {
        const { error } = await supabase
            .from('book_quotes')
            .delete()
            .eq('id', quoteId)

        if (error) {
            toast.error("Failed to delete quote")
        } else {
            setQuotes(quotes.filter(q => q.id !== quoteId))
            toast.success("Quote deleted")
        }
    }

    const filteredQuotes = filter === 'favorites'
        ? quotes.filter(q => q.is_favorite)
        : quotes

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-6 animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                        <div className="h-20 bg-muted rounded mb-4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                ))}
            </div>
        )
    }

    if (quotes.length === 0) {
        return (
            <Card className="p-12 text-center border-dashed">
                <Quote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Quotes Yet</h3>
                <p className="text-muted-foreground mb-6">
                    Start saving your favorite quotes while reading
                </p>
                <Button asChild>
                    <Link href="/dashboard/library">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Go to Library
                    </Link>
                </Button>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${filter === 'all'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    All Quotes ({quotes.length})
                </button>
                <button
                    onClick={() => setFilter('favorites')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${filter === 'favorites'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Star className="h-4 w-4" />
                    Favorites ({quotes.filter(q => q.is_favorite).length})
                </button>
            </div>

            {/* Quotes List */}
            <div className="space-y-4">
                {filteredQuotes.map((quote) => (
                    <Card key={quote.id} className="p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <Link
                                    href={`/dashboard/reader/${quote.books.id}`}
                                    className="font-semibold hover:underline"
                                >
                                    {quote.books.title}
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    by {quote.books.author}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleFavorite(quote.id, quote.is_favorite)}
                                >
                                    <Star
                                        className={`h-4 w-4 ${quote.is_favorite
                                            ? 'fill-yellow-500 text-yellow-500'
                                            : 'text-muted-foreground'
                                            }`}
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteQuote(quote.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>

                        <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-lg">
                            "{quote.quote_text}"
                        </blockquote>

                        {(quote.page_number || quote.chapter) && (
                            <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                {quote.page_number && <span>Page {quote.page_number}</span>}
                                {quote.chapter && <span>{quote.chapter}</span>}
                            </div>
                        )}

                        {quote.note && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Note:</strong> {quote.note}
                                </p>
                            </div>
                        )}

                        <div className="mt-4 text-xs text-muted-foreground">
                            Saved {new Date(quote.created_at).toLocaleDateString()}
                        </div>
                    </Card>
                ))}
            </div>

            {filteredQuotes.length === 0 && filter === 'favorites' && (
                <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No favorite quotes yet. Star quotes to save them as favorites!</p>
                </div>
            )}
        </div>
    )
}
