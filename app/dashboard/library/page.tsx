"use client"

import { useEffect, useState, useCallback } from "react"
import { LibraryContent } from "@/components/features/library/library-content"
import { UploadModal } from "@/components/features/library/upload-modal"
import { WelcomeAnimation } from "@/components/features/welcome-animation"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

export default function LibraryPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [books, setBooks] = useState<Array<{
        id: string
        user_id: string
        title: string
        author: string
        cover_url: string | null
        file_url: string
        format: 'pdf' | 'epub' | 'txt'
        total_pages: number
        created_at: string
        updated_at: string
        progress: number
    }>>([])
    const [loading, setLoading] = useState(true)
    const [showWelcome, setShowWelcome] = useState(false)

    const loadBooks = useCallback(async () => {
        if (!user) return

        const supabase = createBrowserClient(
            process.env['NEXT_PUBLIC_SUPABASE_URL']!,
            process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
        )

        try {
            setLoading(true)
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
                    updated_at,
                    reading_progress (
                        progress_percentage
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const transformedBooks = booksData?.map(book => ({
                ...book,
                reading_progress: undefined,
                progress: book['reading_progress']?.[0]?.['progress_percentage'] || 0
            })) || []

            setBooks(transformedBooks as any)

            // Show welcome animation on first visit
            const hasSeenWelcome = sessionStorage.getItem('library-welcome-seen')
            if (!hasSeenWelcome && transformedBooks.length === 0) {
                setShowWelcome(true)
                sessionStorage.setItem('library-welcome-seen', 'true')
            }
        } catch (error) {
            console.error('Error loading books:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            router.push("/login")
            return
        }

        loadBooks()
    }, [user, authLoading, router, loadBooks])

    if (authLoading || (loading && books.length === 0)) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <>
            {showWelcome && (
                <WelcomeAnimation
                    message="Welcome to Your Treasures"
                    onComplete={() => setShowWelcome(false)}
                    duration={3000}
                />
            )}
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">Your Library</h2>
                        <p className="text-muted-foreground text-lg">Manage and explore your collection of treasures.</p>
                    </div>
                    <UploadModal onSuccess={loadBooks} />
                </div>

                <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[3rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <LibraryContent books={books} />
                </div>
            </div>
        </>
    )
}
