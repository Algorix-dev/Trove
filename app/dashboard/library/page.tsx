"use client"

import { useEffect, useState } from "react"
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

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            router.push("/login")
            return
        }

        const fetchBooks = async () => {
            const supabase = createBrowserClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
            )

            try {
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
                        updated_at,
                        reading_progress (
                            progress_percentage
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching books:', error)
                    setLoading(false)
                    return
                }

                // Transform data to include progress percentage
                const transformedBooks = booksData?.map(book => ({
                    ...book,
                    reading_progress: undefined,
                    progress: book.reading_progress?.[0]?.progress_percentage || 0
                })) || []

                setBooks(transformedBooks)
                
                // Show welcome animation on first visit
                const hasSeenWelcome = sessionStorage.getItem('library-welcome-seen')
                if (!hasSeenWelcome && transformedBooks.length === 0) {
                    setShowWelcome(true)
                    sessionStorage.setItem('library-welcome-seen', 'true')
                }
            } catch (error) {
                console.error('Unexpected error fetching books:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBooks()
    }, [user, authLoading, router])

    if (authLoading || loading) {
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
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Library</h2>
                    <UploadModal />
                </div>

                <LibraryContent books={books} />
            </div>
        </>
    )
}
