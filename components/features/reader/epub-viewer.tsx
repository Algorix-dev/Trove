"use client"

import { useEffect, useRef, useState } from "react"
import Epub from "epubjs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { GamificationService } from "@/lib/gamification"

interface EpubViewerProps {
    url: string
    initialLocation?: string | number
    onLocationChange?: (location: string, progress: number) => void
    readerTheme?: 'light' | 'dark' | 'sepia'
    userId: string
    bookId: string
    onLocationUpdate?: (data: { currentPage?: number; currentCFI?: string; progressPercentage?: number }) => void
}

export function EpubViewer({ url, initialLocation, onLocationChange, readerTheme = 'light', userId, bookId, onLocationUpdate }: EpubViewerProps) {
    const viewerRef = useRef<HTMLDivElement>(null)
    const renditionRef = useRef<any>(null)
    const bookRef = useRef<any>(null)
    const saveProgressDebounced = useRef<NodeJS.Timeout | undefined>(undefined)
    const [isReady, setIsReady] = useState(false)
    const [currentCfi, setCurrentCfi] = useState<string>("")
    const [progress, setProgress] = useState(0)

    const saveProgress = async (cfi: string, progressValue: number) => {
        const supabase = createBrowserSupabaseClient()

        await supabase
            .from('reading_progress')
            .upsert({
                book_id: bookId,
                user_id: userId,
                current_page: 0, // Epub doesn't have linear pages nicely mapped to numbers usually so we trust percentage
                progress_percentage: progressValue,
                epub_cfi: cfi,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'book_id,user_id'
            })
    }

    // Debounced save to prevent excessive writes
    const debouncedSave = (cfi: string, progressValue: number) => {
        if (saveProgressDebounced.current) {
            clearTimeout(saveProgressDebounced.current)
        }
        saveProgressDebounced.current = setTimeout(() => {
            saveProgress(cfi, progressValue)
        }, 2000) // Save 2 seconds after last location change
    }

    const updateProgress = () => {
        if (!bookRef.current || !renditionRef.current) return

        const currentLocation = renditionRef.current.currentLocation()
        if (currentLocation && currentLocation.start) {
            const cfi = currentLocation.start.cfi
            // Get percentage
            const percentage = bookRef.current.locations.percentageFromCfi(cfi)
            const progressValue = Math.round(percentage * 100)

            setProgress(progressValue)

            if (onLocationChange) {
                onLocationChange(cfi, progressValue)
            }

            if (onLocationUpdate) {
                onLocationUpdate({
                    currentCFI: cfi,
                    progressPercentage: progressValue
                })
            }

            // Use debounced save instead of immediate save
            debouncedSave(cfi, progressValue)
        }
    }

    useEffect(() => {
        if (!viewerRef.current) return

        const book = Epub(url)
        bookRef.current = book

        const rendition = book.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            flow: "paginated",
            manager: "default",
        })
        renditionRef.current = rendition

        const initBook = async () => {
            await book.ready

            // Display initial location or start
            if (initialLocation) {
                await rendition.display(initialLocation.toString())
            } else {
                await rendition.display()
            }

            // Generate locations for progress tracking
            book.locations.generate(1000).then(() => {
                setIsReady(true)
                updateProgress()
            })

            // Listen for relocation events
            rendition.on("relocated", (location: any) => {
                setCurrentCfi(location.start.cfi)
                updateProgress()
            })
        }

        initBook()

        return () => {
            if (bookRef.current) {
                bookRef.current.destroy()
            }
        }
    }, [url])

    // Handle Theme Changes
    useEffect(() => {
        if (!renditionRef.current) return

        const themes = renditionRef.current.themes

        // Register themes
        themes.register("light", { body: { color: "#000000", background: "#ffffff" } })
        themes.register("dark", { body: { color: "#ffffff", background: "#1a1a1a" } })
        themes.register("sepia", { body: { color: "#5f4b32", background: "#f6f1d1" } })

        // Select theme
        themes.select(readerTheme)
    }, [readerTheme, isReady])

    // Track reading time and award XP
    useEffect(() => {
        let sessionStart = Date.now()

        const interval = setInterval(async () => {
            if (isReady) {
                const minutesRead = Math.round((Date.now() - sessionStart) / 60000)

                if (minutesRead >= 1) {
                    const supabase = createBrowserSupabaseClient()

                    // Create reading session record
                    await supabase
                        .from('reading_sessions')
                        .insert({
                            user_id: userId,
                            book_id: bookId,
                            duration_minutes: 1,
                            session_date: new Date().toISOString().split('T')[0]
                        })

                    // Award XP
                    await GamificationService.awardXP(userId, 1, "Reading Time", bookId)

                    // Reset session start
                    sessionStart = Date.now()
                }
            }
        }, 60000) // Every minute

        return () => clearInterval(interval)
    }, [userId, isReady, bookId])

    const prevPage = () => {
        if (renditionRef.current) {
            renditionRef.current.prev()
        }
    }

    const nextPage = () => {
        if (renditionRef.current) {
            renditionRef.current.next()
        }
    }

    return (
        <div className="flex flex-col h-full relative group">
            <div className="flex-1 relative">
                <div ref={viewerRef} className="h-full w-full" />

                {/* Navigation Overlays */}
                <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-background/80 shadow-md ml-4"
                        onClick={prevPage}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </div>
                <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-background/80 shadow-md mr-4"
                        onClick={nextPage}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            <div className="h-8 border-t bg-background flex items-center justify-center text-xs text-muted-foreground">
                {progress}% Read
            </div>
        </div>
    )
}
