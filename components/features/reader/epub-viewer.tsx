'use client';

import { createBrowserClient } from '@supabase/ssr';
import Epub from 'epubjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { GamificationService } from '@/lib/gamification';

interface EpubViewerProps {
  url: string;
  initialLocation?: string | number;
  onLocationChange?: (location: string, progress: number) => void;
  readerTheme?: 'light' | 'dark' | 'sepia';
  userId: string;
  bookId: string;
  onLocationUpdate?: (data: {
    currentPage?: number;
    currentCFI?: string;
    progressPercentage?: number;
  }) => void;
  onMetadata?: (data: { toc: any[] }) => void;
  onSaveHighlight?: (data: any) => Promise<void>;
  bookTitle?: string;
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
}: EpubViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const saveProgressDebounced = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number; cfi: string } | null>(null);

  const saveProgress = async (cfi: string, progressValue: number) => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    // 1. Update reading_progress table
    await supabase.from('reading_progress').upsert(
      {
        book_id: bookId,
        user_id: userId,
        current_page: 0, // Epub doesn't have linear pages nicely mapped to numbers usually so we trust percentage
        progress_percentage: progressValue,
        epub_cfi: cfi,
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
        progress_percentage: progressValue,
        current_location: cfi,
        last_read_at: new Date().toISOString(),
      })
      .eq('id', bookId)
      .eq('user_id', userId);
  };

  // Debounced save to prevent excessive writes
  const debouncedSave = (cfi: string, progressValue: number) => {
    if (saveProgressDebounced.current) {
      clearTimeout(saveProgressDebounced.current);
    }
    saveProgressDebounced.current = setTimeout(() => {
      saveProgress(cfi, progressValue);
    }, 2000); // Save 2 seconds after last location change
  };

  const updateProgress = () => {
    if (!bookRef.current || !renditionRef.current) return;

    const currentLocation = renditionRef.current.currentLocation();
    if (currentLocation && currentLocation.start) {
      const cfi = currentLocation.start.cfi;
      // Get percentage
      const percentage = bookRef.current.locations.percentageFromCfi(cfi);
      const progressValue = Math.round(percentage * 100);

      setProgress(progressValue);

      if (onLocationChange) {
        onLocationChange(cfi, progressValue);
      }

      if (onLocationUpdate) {
        onLocationUpdate({
          currentCFI: cfi,
          progressPercentage: progressValue,
        });
      }

      // Use debounced save instead of immediate save
      debouncedSave(cfi, progressValue);
    }
  };

  useEffect(() => {
    if (!viewerRef.current) return;

    const book = Epub(url);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      manager: 'default',
    });
    renditionRef.current = rendition;

    const initBook = async () => {
      try {
        await book.ready;

        // Display initial location or start
        if (initialLocation) {
          await rendition.display(initialLocation.toString());
        } else {
          await rendition.display();
        }

        // Generate locations for progress tracking
        book.locations.generate(1000).then(() => {
          setIsReady(true);
          updateProgress();
        });

        // Handle selection
        rendition.on('selected', (cfiRange: string, contents: any) => {
          const range = contents.range(cfiRange);
          const rect = range.getBoundingClientRect();
          const text = rendition.getRange(cfiRange).toString();

          setSelection({
            text: text.trim(),
            cfi: cfiRange,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });

          // Add highlight to rendition immediately (client-side only)
          rendition.annotations.add('highlight', cfiRange, {}, (e: any) => {
            console.log('Highlight clicked', e);
          });

          // Clean up selection visual
          contents.window.getSelection().removeAllRanges();
        });

        // Extract TOC
        if (onMetadata) {
          const navigation = book.navigation;
          if (navigation && navigation.toc) {
            const formattedToc = navigation.toc.map((item: any, index: number) => ({
              id: index,
              label: item.label,
              data: { cfi: item.href }
            }));
            onMetadata({ toc: formattedToc });
          }
        }

        // Listen for relocation events
        rendition.on('relocated', () => {
          updateProgress();
        });
      } catch (err) {
        console.error('Failed to initialize EPUB:', err);
        setError('Failed to load EPUB. This might be due to a corrupted file or an expired link.');
      }
    };

    initBook();

    return () => {
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [url]);

  // Handle external location changes
  useEffect(() => {
    if (initialLocation && renditionRef.current) {
      renditionRef.current.display(initialLocation.toString());
    }
  }, [initialLocation]);

  // Handle Theme Changes
  useEffect(() => {
    if (!renditionRef.current) return;

    const themes = renditionRef.current.themes;

    // Register themes
    themes.register('light', { body: { color: '#000000', background: '#ffffff' } });
    themes.register('dark', { body: { color: '#ffffff', background: '#1a1a1a' } });
    themes.register('sepia', { body: { color: '#5f4b32', background: '#f6f1d1' } });

    // Select theme
    themes.select(readerTheme);
  }, [readerTheme, isReady]);

  // Track reading time and award XP
  useEffect(() => {
    let sessionStart = Date.now();

    const interval = setInterval(async () => {
      if (isReady) {
        const minutesRead = Math.round((Date.now() - sessionStart) / 60000);

        if (minutesRead >= 1) {
          const supabase = createBrowserClient(
            process.env['NEXT_PUBLIC_SUPABASE_URL']!,
            process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
          );

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
  }, [userId, isReady, bookId]);

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
        <p className="text-destructive font-bold mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative group">
      <div className="flex-1 relative">
        <div ref={viewerRef} className="h-full w-full" />

        {selection && onSaveHighlight && (
          <div
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            style={{ left: selection.x, top: selection.y }}
          >
            <HighlightMenu
              selectedText={selection.text}
              bookId={bookId}
              bookTitle={bookTitle}
              onSave={(data) => onSaveHighlight({ ...data, selection_data: { cfi: selection.cfi } })}
              onClose={() => setSelection(null)}
            />
          </div>
        )}

        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

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
  );
}
