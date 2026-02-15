'use client';

import { createBrowserClient } from '@supabase/ssr';
import Epub from 'epubjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { GamificationService } from '@/lib/gamification';

interface EpubViewerProps {
  url: string;
  initialLocation?: string | number;
  onLocationChange?: (location: string, progress: number) => void;
  readerTheme?: 'light' | 'dark' | 'sepia' | 'night' | 'custom';
  userId: string;
  bookId: string;
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
  fontSize?: number;
}

export function EpubViewer({
  url,
  initialLocation,
  onLocationChange,
  readerTheme = 'light',
  userId,
  bookId,
  bookTitle = 'Untitled',
  onLocationUpdate,
  onMetadata,
  onSaveHighlight,
  author,
  fontSize = 100,
}: EpubViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number; cfi: string } | null>(null);
  const [highlights, setHighlights] = useState<any[]>([]);

  // Removed saveProgress and debouncedSave functions as per instruction to remove local persistence logic.
  // The instruction implies removing the persistence mechanism, not just local storage.
  // The provided "Code Edit" snippet was malformed, so I'm interpreting the intent.


  const loadHighlights = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );
    const { data } = await supabase
      .from('book_quotes')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', userId);

    if (data && renditionRef.current) {
      setHighlights(data);
      const rendition = renditionRef.current;
      data.forEach((h) => {
        const cfi = (h.selection_data as any)?.cfi;
        if (cfi) {
          // Remove if exists to avoid duplicates
          rendition.annotations.remove(cfi, 'highlight');

          rendition.annotations.add(
            'highlight',
            cfi,
            {},
            () => {
              const range = rendition.getRange(cfi);
              const rect = range.getBoundingClientRect();
              setSelection({
                text: h.quote_text,
                cfi: cfi,
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
                ...h,
              } as any);
            },
            'hl',
            { fill: h.color || '#fef08a', 'fill-opacity': '0.3' }
          );
        }
      });
    }
  }, [bookId, userId]);

  const handleUpdateHighlight = async (id: string, data: any) => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );
    const { error } = await supabase.from('book_quotes').update(data).eq('id', id);

    if (error) throw error;
    toast.success('Highlight updated');
    loadHighlights();
  };

  const handleDeleteHighlight = async (id: string) => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    const hl = highlights.find((h) => h.id === id);
    const cfi = (hl?.selection_data as any)?.cfi;

    const { error } = await supabase.from('book_quotes').delete().eq('id', id);

    if (error) throw error;

    if (cfi && renditionRef.current) {
      renditionRef.current.annotations.remove(cfi, 'highlight');
    }

    toast.success('Highlight removed');
    loadHighlights();
  };

  const updateProgress = () => {
    if (!bookRef.current || !renditionRef.current) return;

    const currentLocation = renditionRef.current.currentLocation();
    if (currentLocation && currentLocation.start) {
      const cfi = currentLocation.start.cfi;
      // Get percentage
      const percentage = bookRef.current.locations.percentageFromCfi(cfi);
      const progressValue = Math.round(percentage * 100);

      // EPUBjs page calculation (rough but better than index)
      const loc = bookRef.current.locations.locationFromCfi(cfi);
      const calculatedPage = loc > 0 ? loc : (currentLocation.start.index + 1);

      setProgress(progressValue);

      if (onLocationChange) {
        onLocationChange(cfi, progressValue);
      }

      if (onLocationUpdate) {
        onLocationUpdate({
          currentCFI: cfi,
          progressPercentage: progressValue,
          currentPage: calculatedPage,
        });
      }

      // Removed debouncedSave call as per instruction to remove local persistence logic.
    }
  };

  // Track reading time and award XP (Robust Heartbeat)
  useEffect(() => {
    if (!isReady || !!error) return;

    let startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 55000) { // Approx 1 min
        const currentLocation = renditionRef.current?.currentLocation();
        const cfi = currentLocation?.start?.cfi;
        const loc = bookRef.current?.locations.locationFromCfi(cfi);
        const page = loc > 0 ? loc : ((currentLocation?.start?.index || 0) + 1);

        await GamificationService.awardXP(userId, 1, 'Reading Time', bookId, {
          startPage: page,
          endPage: page
        });

        startTime = Date.now();
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [isReady, error, userId, bookId]);

  // 1. Initialize Book & Rendition
  useEffect(() => {
    if (!viewerRef.current || !url) return;

    const book = Epub(url);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      manager: 'default',
    });
    renditionRef.current = rendition;

    const startBook = async () => {
      try {
        await book.ready;

        // Initial display
        if (initialLocation) {
          await rendition.display(initialLocation.toString());
        } else {
          await rendition.display();
        }

        // Generate locations
        book.locations.generate(1000).then(() => {
          setIsReady(true);
          updateProgress();
        });

        // Set up events
        // Professional Selection API within Iframe
        rendition.on('selected', (cfiRange: string, contents: any) => {
          const range = contents.range(cfiRange);
          const rect = range.getBoundingClientRect();
          const text = rendition.getRange(cfiRange).toString();

          // Account for iframe offset in the viewport
          const iframeRect = contents.window.frameElement.getBoundingClientRect();

          setSelection({
            text: text.trim(),
            cfi: cfiRange,
            x: iframeRect.left + rect.left + rect.width / 2,
            y: iframeRect.top + rect.top, // Anchored to top in viewport
          });

          // Visual highlight (optional, but requested for feedback)
          rendition.annotations.add('highlight', cfiRange, {}, () => { });
        });

        // Ensure clicking outside clears selection
        rendition.on('click', () => {
          setSelection(null);
          if (selection?.cfi) {
            rendition.annotations.remove(selection.cfi, 'highlight');
          }
        });

        rendition.on('relocated', () => {
          updateProgress();
        });

        // Extract TOC
        if (onMetadata) {
          const navigation = book.navigation;
          if (navigation?.toc) {
            const formattedToc = navigation.toc.map((item: any, index: number) => ({
              id: index,
              label: item.label,
              data: { cfi: item.href }
            }));
            onMetadata({ toc: formattedToc });
          }
        }

        loadHighlights();
      } catch (err) {
        console.error('EPUB Init Error:', err);
        setError('Failed to load EPUB.');
      }
    };

    startBook();

    return () => {
      if (bookRef.current) bookRef.current.destroy();
    };
  }, [url]); // ONLY RE-INIT IF URL CHANGES

  // 2. Reactive Navigation
  useEffect(() => {
    if (isReady && renditionRef.current && initialLocation) {
      // Check if we are already at this location to prevent loops
      const currentLocation = renditionRef.current.currentLocation();
      if (currentLocation?.start?.cfi !== initialLocation) {
        renditionRef.current.display(initialLocation.toString());
      }
    }
  }, [isReady, initialLocation]);

  // Reactive Theme & Font Size
  useEffect(() => {
    if (isReady && renditionRef.current) {
      const themes = renditionRef.current.themes;

      // Use the CSS variables from ReaderLayout
      const styles: any = {
        body: {
          background: 'transparent !important',
          color: 'var(--reader-text) !important',
          'font-family': 'Inter, sans-serif !important',
          'font-size': `${fontSize}% !important`,
          'line-height': '1.8 !important',
          'letter-spacing': '0.015em !important',
          'padding': '0 20px !important'
        },
        '::selection': {
          background: 'rgba(59, 130, 246, 0.3) !important',
        }
      };

      themes.register('custom', styles);
      themes.select('custom');
      themes.fontSize(`${fontSize}%`);

      // Force background update on the viewer container
      if (viewerRef.current) {
        viewerRef.current.style.backgroundColor = 'var(--reader-bg)';
      }
    }
  }, [isReady, readerTheme, fontSize]);

  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-destructive mb-4">Error loading book</div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full group relative bg-[var(--reader-bg)] text-[var(--reader-text)] transition-colors duration-300">
      <div className="flex-1 w-full relative">
        <div ref={viewerRef} className="h-full w-full" />

        {selection && (
          <div
            className="fixed z-[200] -translate-x-1/2 -translate-y-4"
            style={{ left: selection.x, top: selection.y }}
          >
            <HighlightMenu
              selectedText={selection.text}
              bookId={bookId}
              bookTitle={bookTitle}
              author={author}
              pageNumber={renditionRef.current?.currentLocation()?.start?.cfi
                ? (bookRef.current?.locations.locationFromCfi(renditionRef.current.currentLocation().start.cfi) || 0)
                : 0}
              onSave={async (data) => {
                try {
                  const promise = onSaveHighlight?.({ ...data, selection_data: { cfi: selection.cfi } });
                  await (promise || Promise.resolve());
                  setSelection(null);
                  // Do NOT remove annotation here, loadHighlights will refresh it
                  loadHighlights();
                  renditionRef.current?.getContents().forEach((c: any) => c.window.getSelection().removeAllRanges());
                } catch (err: any) {
                  console.error('Failed to save highlight in EpubViewer:', err);
                  // Assuming `toast` is available in this scope, e.g., imported from a UI library
                  // If not, this line will cause an error and needs to be adapted or removed.
                  // For example, if using react-hot-toast: import toast from 'react-hot-toast';
                  // toast.error(`Save failed: ${err.message || 'Unknown error'}`);
                }
              }}
              onUpdate={handleUpdateHighlight}
              onDelete={handleDeleteHighlight}
              onClose={() => {
                // Remove temporary highlight only on cancel
                if (selection?.cfi) {
                  const isPermanent = highlights.some(h => (h.selection_data as any)?.cfi === selection.cfi);
                  if (!isPermanent) {
                    renditionRef.current?.annotations.remove(selection.cfi, 'highlight');
                  }
                }
                setSelection(null);
                renditionRef.current?.getContents().forEach((c: any) => c.window.getSelection().removeAllRanges());
              }}
            />
          </div>
        )}

        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 bg-[var(--reader-bg)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--reader-accent)]"></div>
          </div>
        )}

        {/* Navigation Overlays */}
        <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full shadow-md ml-4 bg-[var(--reader-bg-secondary)]/80 hover:bg-[var(--reader-accent)]/20"
            onClick={prevPage}
          >
            <ChevronLeft className="h-6 w-6 text-[var(--reader-text)]" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full shadow-md mr-4 bg-[var(--reader-bg-secondary)]/80 hover:bg-[var(--reader-accent)]/20"
            onClick={nextPage}
          >
            <ChevronRight className="h-6 w-6 text-[var(--reader-text)]" />
          </Button>
        </div>
      </div>

      <div className="h-8 border-t border-[var(--reader-border)] flex items-center justify-center text-xs transition-colors bg-[var(--reader-bg-secondary)] text-[var(--reader-text-muted)]">
        {progress}% Read
      </div>
    </div>
  );
}
