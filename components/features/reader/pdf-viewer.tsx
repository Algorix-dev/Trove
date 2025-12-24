"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { createBrowserClient } from "@supabase/ssr";
import { GamificationService } from "@/lib/gamification";

// Configure PDF.js worker
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
    fileUrl: string;
    bookId: string;
    userId: string;
    readerTheme?: 'light' | 'dark' | 'sepia';
    onLocationUpdate?: (data: { currentPage?: number; currentCFI?: string; progressPercentage?: number }) => void;
    initialPage?: number;
}

export function PDFViewer({ fileUrl, bookId, userId, readerTheme = 'light', onLocationUpdate, initialPage }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    // Load bookmark or saved progress on mount
    useEffect(() => {
        // If we have initialPage (from bookmark), use that
        if (initialPage && initialPage > 0) {
            setPageNumber(initialPage);
            return;
        }

        // Otherwise load from reading progress
        const loadProgress = async () => {
            const { data } = await supabase
                .from('reading_progress')
                .select('current_page')
                .eq('book_id', bookId)
                .eq('user_id', userId)
                .single();

            if (data?.current_page) {
                setPageNumber(data.current_page);
            }
        };
        loadProgress();
    }, [bookId, userId, initialPage]);

    // Save progress when page changes (DEBOUNCED)
    useEffect(() => {
        if (pageNumber > 0 && numPages > 0) {
            const progressPercentage = Math.round((pageNumber / numPages) * 100);

            // Notify parent about location change
            if (onLocationUpdate) {
                onLocationUpdate({
                    currentPage: pageNumber,
                    progressPercentage
                });
            }

            // Debounced save - only save after user stops changing pages
            const saveTimeout = setTimeout(async () => {
                await supabase
                    .from('reading_progress')
                    .upsert({
                        book_id: bookId,
                        user_id: userId,
                        current_page: pageNumber,
                        total_pages: numPages,
                        progress_percentage: progressPercentage,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'book_id,user_id'
                    });
            }, 1000); // Save 1 second after last page change

            return () => clearTimeout(saveTimeout);
        }
        return undefined;
    }, [pageNumber, numPages, bookId, userId, onLocationUpdate]);

    // Track reading time and award XP
    useEffect(() => {
        let sessionStart = Date.now()

        const interval = setInterval(async () => {
            // Check if actively reading
            if (!loading && numPages > 0) {
                const minutesRead = Math.round((Date.now() - sessionStart) / 60000)

                if (minutesRead >= 1) {
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
    }, [userId, loading, numPages, bookId])

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    // Theme styles with CSS filters for PDF
    const themeStyles = {
        light: {
            background: 'bg-muted/30',
            pageBackground: 'bg-white',
            filter: 'none'
        },
        dark: {
            background: 'bg-gray-900',
            pageBackground: 'bg-gray-800',
            filter: 'invert(1) hue-rotate(180deg)' // Invert colors for dark mode
        },
        sepia: {
            background: 'bg-amber-50',
            pageBackground: 'bg-amber-100',
            filter: 'sepia(0.5) brightness(1.1)' // Apply sepia tone
        }
    };

    const currentTheme = themeStyles[readerTheme];

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="h-12 border-b bg-background flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
                        disabled={scale <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScale(prev => Math.min(prev + 0.1, 2.0))}
                        disabled={scale >= 2.0}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Viewer */}
            <div className={`flex-1 overflow-auto flex justify-center p-8 ${currentTheme.background}`}>
                <div className="shadow-2xl">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center h-96 w-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        }
                        error={
                            <div className="flex items-center justify-center h-96 w-full text-destructive">
                                Failed to load PDF. Please try again.
                            </div>
                        }
                    >
                        <div style={{ filter: currentTheme.filter }}>
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className={currentTheme.pageBackground}
                            />
                        </div>
                    </Document>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="h-16 border-t bg-background flex items-center justify-center gap-4 px-4 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                    disabled={pageNumber <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                    Page {pageNumber} of {numPages || '--'}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                    disabled={pageNumber >= numPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
