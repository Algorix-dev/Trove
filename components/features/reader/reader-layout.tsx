"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Bookmark } from "lucide-react"
import Link from "next/link"
import React, { useState, useEffect, ReactElement, useCallback } from "react"
import { ReaderSettings } from "@/components/features/reader/reader-settings"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface LocationData {
    currentPage?: number;
    currentCFI?: string;
    progressPercentage?: number;
}

interface ReaderLayoutProps {
    children: React.ReactNode;
    title: string;
    bookId: string;
    userId: string;
}

import { toast } from "sonner"

export function ReaderLayout({ children, title, bookId, userId }: ReaderLayoutProps) {
    const [showSettings, setShowSettings] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>('light')
    const [currentLocation, setCurrentLocation] = useState<LocationData>({})

    // Detect location updates
    const handleLocationUpdate = useCallback((data: LocationData) => {
        setCurrentLocation(prev => {
            // Only update if values actually changed to prevent loops
            if (
                prev.currentPage === data.currentPage &&
                prev.currentCFI === data.currentCFI &&
                prev.progressPercentage === data.progressPercentage
            ) {
                return prev
            }
            return { ...prev, ...data }
        })
    }, [])

    const supabase = createBrowserSupabaseClient();

    // Load bookmark status
    useEffect(() => {
        const loadBookmark = async () => {
            const { data } = await supabase
                .from('bookmarks')
                .select('id')
                .eq('book_id', bookId)
                .eq('user_id', userId)
                .single();

            setIsBookmarked(!!data);
        };
        loadBookmark();
    }, [bookId, userId]);

    const handleBookmark = async () => {
        if (isBookmarked) {
            // Remove bookmark
            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('book_id', bookId)
                .eq('user_id', userId);

            if (!error) {
                setIsBookmarked(false);
                toast.success("Bookmark removed")
            }
        } else {
            // Add bookmark with location context
            const { error } = await supabase
                .from('bookmarks')
                .insert({
                    book_id: bookId,
                    user_id: userId,
                    page_number: currentLocation.currentPage,
                    epub_cfi: currentLocation.currentCFI,
                    progress_percentage: currentLocation.progressPercentage,
                    created_at: new Date().toISOString()
                });

            if (!error) {
                setIsBookmarked(true);
                toast.success("Bookmark saved")
            } else {
                toast.error("Failed to save bookmark")
            }
        }
    }



    const handleThemeChange = (theme: 'light' | 'dark' | 'sepia') => {
        setReaderTheme(theme);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/library">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold truncate max-w-[200px] md:max-w-md">{title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBookmark}
                        className={isBookmarked ? "text-primary" : ""}
                    >
                        <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                {React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as ReactElement<any>, {
                            readerTheme,
                            onLocationUpdate: handleLocationUpdate
                        });
                    }
                    return child;
                })}
                {showSettings && (
                    <div className="absolute top-4 right-4 z-50">
                        <ReaderSettings onThemeChange={handleThemeChange} currentTheme={readerTheme} />
                    </div>
                )}
            </main>
        </div>
    )
}
