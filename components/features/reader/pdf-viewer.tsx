'use client';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';

import { Button } from '@/components/ui/button';
import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { GamificationService } from '@/lib/gamification';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  bookId: string;
  userId: string;
  readerTheme?: 'light' | 'dark' | 'sepia';
  onLocationUpdate?: (data: {
    currentPage?: number;
    totalPages?: number;
    currentCFI?: string;
    progressPercentage?: number;
  }) => void;
  onMetadata?: (data: { toc: any[] }) => void;
  onSaveHighlight?: (data: any) => Promise<void>;
  bookTitle?: string;
  initialPage?: number;
}

export function PDFViewer({
  fileUrl,
  bookId,
  userId,
  readerTheme = 'light',
  onLocationUpdate,
  onMetadata,
  onSaveHighlight,
  bookTitle = 'Untitled',
  initialPage,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

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
        .maybeSingle();

      if (data?.current_page) {
        setPageNumber(data.current_page);
      }
    };
    loadProgress();
  }, [bookId, userId, initialPage]);

  // Handle external page changes
  useEffect(() => {
    if (initialPage && initialPage !== pageNumber) {
      setPageNumber(initialPage);
    }
  }, [initialPage]);

  // Save progress when page changes (DEBOUNCED)
  useEffect(() => {
    if (pageNumber > 0 && numPages > 0) {
      const progressPercentage = Math.round((pageNumber / numPages) * 100);

      // Notify parent about location change
      if (onLocationUpdate) {
        onLocationUpdate({
          currentPage: pageNumber,
          progressPercentage,
        });
      }

      // Debounced save - only save after user stops changing pages
      const saveTimeout = setTimeout(async () => {
        // 1. Update reading_progress table
        await supabase.from('reading_progress').upsert(
          {
            book_id: bookId,
            user_id: userId,
            current_page: pageNumber,
            total_pages: numPages,
            progress_percentage: progressPercentage,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'book_id,user_id',
          }
        );

        // 2. Sync to books table for library/dashboard overview
        await supabase
          .from('books')
          .update({
            progress_percentage: progressPercentage,
            current_page: pageNumber,
            last_read_at: new Date().toISOString(),
          })
          .eq('id', bookId)
          .eq('user_id', userId);
      }, 1000); // Save 1 second after last page change

      return () => clearTimeout(saveTimeout);
    }
    return undefined;
  }, [pageNumber, numPages, bookId, userId, onLocationUpdate]);


  const handleUpdateHighlight = async (id: string, data: any) => {
    const { error } = await supabase.from('book_quotes').update(data).eq('id', id);

    if (error) throw error;
    toast.success('Highlight updated');
  };

  const handleDeleteHighlight = async (id: string) => {
    const { error } = await supabase.from('book_quotes').delete().eq('id', id);

    if (error) throw error;
    toast.success('Highlight removed');
  };

  // Track reading time and award XP
  useEffect(() => {
    let sessionStart = Date.now();

    const interval = setInterval(async () => {
      // Check if actively reading
      if (!loading && numPages > 0) {
        const minutesRead = Math.round((Date.now() - sessionStart) / 60000);

        if (minutesRead >= 1) {
          // Create reading session record
          await supabase.from('reading_sessions').insert({
            user_id: userId,
            book_id: bookId,
            duration_minutes: 1,
            session_date: new Date().toISOString().split('T')[0],
          });

          // Award XP
          await GamificationService.awardXP(userId, 1, 'Reading Time', bookId);

          // Reset session start
          sessionStart = Date.now();
        }
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [userId, loading, numPages, bookId]);

  async function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages);
    setLoading(false);

    if (onLocationUpdate) {
      onLocationUpdate({ totalPages: pdf.numPages });
    }

    // Extract TOC (Outline)
    if (onMetadata) {
      try {
        const outline = await pdf.getOutline();
        if (outline) {
          const formattedToc = await Promise.all(outline.map(async (item: any, index: number) => {
            let pageNum = null;
            if (item.dest) {
              const dest = await pdf.getDestination(item.dest);
              if (dest) {
                pageNum = await pdf.getPageIndex(dest[0]) + 1;
              }
            }
            return {
              id: index,
              label: item.title,
              data: { page: pageNum }
            };
          }));

          onMetadata({ toc: formattedToc.filter(i => i.data.page !== null) });
        }
      } catch (err) {
        console.error('Failed to get PDF outline:', err);
      }
    }
  }

  const handleMouseUp = () => {
    const selected = window.getSelection();
    if (selected && selected.toString().trim()) {
      const range = selected.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: selected.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelection(null);
    }
  };

  // Theme styles with CSS filters for PDF
  const themeStyles = {
    light: {
      background: 'bg-muted/30',
      pageBackground: 'bg-white',
      filter: 'none',
    },
    dark: {
      background: 'bg-gray-900',
      pageBackground: 'bg-gray-800',
      filter: 'invert(1) hue-rotate(180deg)', // Invert colors for dark mode
    },
    sepia: {
      background: 'bg-amber-50',
      pageBackground: 'bg-amber-100',
      filter: 'sepia(0.5) brightness(1.1)', // Apply sepia tone
    },
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
            onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale((prev) => Math.min(prev + 0.1, 2.0))}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <div
        className={`flex-1 overflow-auto flex justify-center p-8 ${currentTheme.background} relative`}
        onMouseUp={handleMouseUp}
      >
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

        {selection && onSaveHighlight && (
          <div
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            style={{ left: selection.x, top: selection.y }}
          >
            <HighlightMenu
              selectedText={selection.text}
              bookId={bookId}
              bookTitle={bookTitle}
              pageNumber={pageNumber}
              existingHighlight={(selection as any).id ? selection : undefined}
              onSave={(data) => onSaveHighlight({ ...data, page_number: pageNumber })}
              onUpdate={handleUpdateHighlight}
              onDelete={handleDeleteHighlight}
              onClose={() => setSelection(null)}
            />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-16 border-t bg-background flex items-center justify-center gap-4 px-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
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
          onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
