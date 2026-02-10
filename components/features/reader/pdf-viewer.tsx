'use client';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';

import { Button } from '@/components/ui/button';
import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { GamificationService } from '@/lib/gamification';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  bookId: string;
  userId: string;
  readerTheme?: 'light' | 'dark' | 'sepia' | 'night' | 'custom';
  onLocationUpdate?: (data: {
    currentPage?: number;
    totalPages?: number;
    currentCFI?: string;
    progressPercentage?: number;
  }) => void;
  onMetadata?: (data: { toc: any[] }) => void;
  onSaveHighlight?: (data: any) => Promise<void>;
  bookTitle?: string;
  author?: string;
  initialPage?: number;
  fontSize?: number;
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
  author,
  initialPage,
  fontSize = 100,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(fontSize / 100);
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

  // Sync scale with fontSize prop
  useEffect(() => {
    setScale(fontSize / 100);
  }, [fontSize]);

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
    }
  }, [pageNumber, numPages, onLocationUpdate]);


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

  // Track reading time and award XP (Robust Heartbeat)
  useEffect(() => {
    if (loading || numPages === 0) return;

    let startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 55000) { // Approx 1 min
        await supabase.from('reading_sessions').insert({
          user_id: userId,
          book_id: bookId,
          duration_minutes: 1,
          session_date: new Date().toISOString().split('T')[0],
        });

        await GamificationService.awardXP(userId, 1, 'Reading Time', bookId);
        startTime = Date.now();
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [loading, numPages, userId, bookId]);

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

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const text = selection.toString().trim();

    // Only proceed if selection is within the PDF content
    const container = range.commonAncestorContainer;
    const isInside = container.nodeType === 3 ? container.parentElement?.closest('.react-pdf__Document') : (container as HTMLElement).closest('.react-pdf__Document');

    if (!isInside) {
      setSelection(null);
      return;
    }

    setSelection({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top, // Anchored to top of range
    });
  }, []);

  // Use native listeners for professional selection
  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Theme styles with CSS filters for PDF
  const themeStyles = {
    light: {
      background: 'bg-[#ffffff]',
      pageBackground: 'bg-[#ffffff]',
      filter: 'none',
      textColor: 'text-[#1a1c1e]',
      border: 'border-[#e2e8f0]'
    },
    dark: {
      background: 'bg-[#1a1b1e]',
      pageBackground: 'bg-[#1e1f23]',
      filter: 'invert(0.9) hue-rotate(180deg) brightness(1.05) contrast(0.95)',
      textColor: 'text-[#d1d5db]',
      border: 'border-[#2d2e32]'
    },
    sepia: {
      background: 'bg-[#f4efe1]',
      pageBackground: 'bg-[#f4efe1]',
      filter: 'sepia(0.4) contrast(1.1) brightness(0.95) multiply(1.1)',
      textColor: 'text-[#433422]',
      border: 'border-[#dcd6bc]'
    },
    night: {
      background: 'bg-[#0a0a0b]',
      pageBackground: 'bg-[#0d0d0f]',
      filter: 'invert(0.95) hue-rotate(180deg) brightness(0.8) contrast(0.9)',
      textColor: 'text-[#9ca3af]',
      border: 'border-[#1f1f23]'
    },
  };

  const currentTheme = themeStyles[readerTheme as keyof typeof themeStyles] || themeStyles.light;

  return (
    <div className={cn("flex flex-col h-full", currentTheme.textColor)}>
      {/* Toolbar */}
      <div className={cn(
        "h-12 border-b flex items-center justify-between px-4 transition-colors",
        readerTheme === 'dark' ? 'bg-[#1e1f23] border-[#2d2e32]' :
          readerTheme === 'sepia' ? 'bg-[#ebe3cf] border-[#dcd6bc]' :
            readerTheme === 'night' ? 'bg-[#0d0d0f] border-[#1f1f23]' :
              'bg-[#ffffff] border-[#e2e8f0]'
      )}>
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
        className={cn(
          "flex-1 overflow-auto flex justify-center p-8 relative transition-colors",
          currentTheme.background
        )}
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
            <div style={{ filter: currentTheme.filter }} className="transition-all duration-300">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className={cn("shadow-lg", currentTheme.pageBackground)}
              />
            </div>
          </Document>
        </div>

        {selection && onSaveHighlight && (
          <div
            className="fixed z-[200] -translate-x-1/2 -translate-y-4"
            style={{ left: selection.x, top: selection.y }}
          >
            <HighlightMenu
              selectedText={selection.text}
              bookId={bookId}
              bookTitle={bookTitle}
              author={author}
              pageNumber={pageNumber}
              existingHighlight={(selection as any).id ? selection : undefined}
              onSave={async (data) => {
                await onSaveHighlight({ ...data, page_number: pageNumber });
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              onUpdate={handleUpdateHighlight}
              onDelete={handleDeleteHighlight}
              onClose={() => {
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className={cn("h-16 border-t flex items-center justify-center gap-4 px-4 z-10 transition-colors", currentTheme.background, currentTheme.border)}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          disabled={pageNumber <= 1}
          className={cn("bg-transparent", currentTheme.textColor, currentTheme.border)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className={cn("text-sm font-medium", currentTheme.textColor)}>
          Page {pageNumber} of {numPages || '--'}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
          disabled={pageNumber >= numPages}
          className={cn("bg-transparent", currentTheme.textColor, currentTheme.border)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
