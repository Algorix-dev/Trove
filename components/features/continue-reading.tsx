"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, BookOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

interface ContinueReadingBook {
    id: string
    title: string
    author: string
    cover_url?: string
    current_page: number
    total_pages: number
}

export function ContinueReading() {
    const [book, setBook] = useState<ContinueReadingBook | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLastReadBook = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get most recently updated book from reading_progress
            const { data } = await supabase
                .from('reading_progress')
                .select(`
                    current_page,
                    total_pages,
                    books (
                        id,
                        title,
                        author,
                        cover_url
                    )
                `)
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data && data.books) {
                setBook({
                    id: data.books.id,
                    title: data.books.title,
                    author: data.books.author,
                    cover_url: data.books.cover_url,
                    current_page: data.current_page,
                    total_pages: data.total_pages
                })
            }

            setLoading(false)
        }

        fetchLastReadBook()
    }, [])

    if (loading) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Continue Reading</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        )
    }

    if (!book) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Continue Reading</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">No books in progress. Start reading to see your progress here!</p>
                </CardContent>
            </Card>
        )
    }

    const progress = Math.round((book.current_page / book.total_pages) * 100)
    const isGradient = book.cover_url?.startsWith('gradient:')
    const gradientStyle = isGradient ? book.cover_url?.replace('gradient:', '') : null

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Continue Reading</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
                <div className="h-32 w-24 rounded-md flex-shrink-0 overflow-hidden shadow-sm">
                    {isGradient ? (
                        <div
                            className="w-full h-full flex items-center justify-center text-white"
                            style={{ background: gradientStyle || '' }}
                        >
                            <BookOpen className="h-8 w-8 opacity-80" />
                        </div>
                    ) : book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-between flex-1">
                    <div>
                        <h3 className="text-lg font-semibold">{book.title}</h3>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Page {book.current_page} of {book.total_pages}</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <Link href={`/dashboard/reader/${book.id}`}>
                            <Button size="sm" className="w-fit gap-2 mt-2">
                                <PlayCircle className="h-4 w-4" /> Continue
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
