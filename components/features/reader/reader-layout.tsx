'use client';

import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Bookmark, Settings } from 'lucide-react';
import Link from 'next/link';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ReaderNavigation } from '@/components/features/reader/reader-navigation';
import { ReaderSettings } from '@/components/features/reader/reader-settings';
import { Button } from '@/components/ui/button';
import { cleanBookTitle, cn } from '@/lib/utils';

interface LocationData {
  currentPage?: number;
  totalPages?: number;
  currentCFI?: string;
  progressPercentage?: number;
}

interface ReaderLayoutProps {
  children: ReactElement;
  title: string;
  bookId: string;
  userId: string;
  author?: string;
}

export function ReaderLayout({ children, title, bookId, userId }: ReaderLayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [currentLocation, setCurrentLocation] = useState<LocationData>({});
  const [history, setHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [toc, setToc] = useState<any[]>([]);
  const [jumpLocation, setJumpLocation] = useState<any>(null);
  const locationChangeTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
      ),
    []
  );

  const loadInitialSettings = useCallback(async () => {
    const { data } = await supabase
      .from('user_preferences')
      .select('reader_theme')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.reader_theme) {
      setReaderTheme(data.reader_theme as any);
    }
  }, [supabase, userId]);

  const loadInitialProgress = useCallback(async () => {
    const { data } = await supabase
      .from('reading_progress')
      .select('current_page, epub_cfi, progress_percentage, last_pages')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      if (data.last_pages) setHistory(data.last_pages);

      setJumpLocation((prev: any) => prev || {
        page: data.current_page,
        cfi: data.epub_cfi,
        progress: data.progress_percentage
      });
    }
  }, [supabase, bookId, userId]);

  // Load bookmark status and all bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const { data: allBookmarks, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookmarks:', error);
        return;
      }

      setIsBookmarked(allBookmarks && allBookmarks.length > 0);

      if (allBookmarks) {
        // Show all in the list for now, but Navigation tab will show latest only
        setBookmarks(allBookmarks.map((b: any) => {
          const date = new Date(b.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const label = b.page_number ? `Page ${b.page_number}` : b.progress_percentage ? `${b.progress_percentage}%` : 'Bookmarked Location';

          return {
            id: b.id,
            label: `${label} - ${date}`,
            subLabel: b.note || 'Saved bookmark',
            data: { page: b.page_number, cfi: b.epub_cfi, progress: b.progress_percentage }
          };
        }));
      }
    } catch (error) {
      console.error('Failed to load bookmark:', error);
    }
  }, [bookId, userId, supabase]);

  const loadQuotes = useCallback(async () => {
    const { data } = await supabase
      .from('book_quotes')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setQuotes(data.map((q: any) => {
        const date = new Date(q.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric'
        });
        const label = q.page_number ? `Page ${q.page_number}` : q.chapter || 'Highlight';

        return {
          id: q.id,
          label: `${label} - ${date}`,
          subLabel: q.note || 'Saved from reader',
          data: q
        };
      }));
    }
  }, [bookId, userId, supabase]);

  const handleMetadataUpdate = useCallback((data: { toc: any[] }) => {
    if (data.toc) {
      setToc(data.toc);
    }
  }, []);

  useEffect(() => {
    loadInitialSettings();
    loadBookmarks();
    loadQuotes();
    loadInitialProgress();
  }, [loadInitialSettings, loadBookmarks, loadQuotes, loadInitialProgress]);

  const addToHistory = useCallback((location: LocationData) => {
    if (!location.currentPage && !location.currentCFI && !location.progressPercentage) return;

    const label = location.currentPage ? `Page ${location.currentPage}` : location.progressPercentage ? `${location.progressPercentage}% Progress` : 'Recent Location';

    setHistory(prev => {
      if (prev.length > 0 && prev[0].label === label) return prev;

      const newHistoryItem = {
        id: Date.now(),
        label,
        data: { ...location },
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newHistoryItem, ...prev.filter(h => h.label !== label)].slice(0, 10);

      supabase
        .from('reading_progress')
        .update({ last_pages: updatedHistory })
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .then();

      return updatedHistory;
    });
  }, [bookId, userId, supabase]);

  const handleBookmark = async () => {
    try {
      setIsBookmarking(true);

      const { error } = await supabase.from('bookmarks').insert({
        book_id: bookId,
        user_id: userId,
        page_number: currentLocation.currentPage,
        epub_cfi: currentLocation.currentCFI,
        progress_percentage: currentLocation.progressPercentage,
      });

      if (error) throw error;
      setIsBookmarked(true);
      toast.success('Bookmark saved');
      loadBookmarks();

      // Momentary feedback
      setTimeout(() => setIsBookmarking(false), 2000);
    } catch (error) {
      console.error('Bookmark operation failed:', error);
      toast.error('Failed to save bookmark');
      setIsBookmarking(false);
    }
  };

  const handleSaveHighlight = async (data: any) => {
    try {
      const { error } = await supabase.from('book_quotes').insert({
        user_id: userId,
        book_id: bookId,
        quote_text: data.quote_text,
        page_number: data.page_number || currentLocation.currentPage,
        chapter: data.chapter,
        note: data.note,
        color: data.color,
        highlight_type: data.highlight_type,
        selection_data: data.selection_data,
      });

      if (error) throw error;
      toast.success('Highlight saved!');
      loadQuotes(); // Refresh quotes navigation
    } catch (error) {
      console.error('Save highlight error:', error);
      toast.error('Failed to save highlight');
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'sepia') => {
    setReaderTheme(theme);
    supabase
      .from('user_preferences')
      .upsert({ user_id: userId, reader_theme: theme, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.error('Failed to save theme preference:', error);
      });
  };

  const handleLocationUpdate = useCallback((data: LocationData) => {
    setCurrentLocation((prev) => {
      const next = { ...prev, ...data };

      // CRITICAL: Only reset dwell timer if PAGE or CFI changed. 
      // Progress (%) change (scrolling) should NOT reset the dwell timer.
      const hasPageChanged = next.currentPage !== prev.currentPage || next.currentCFI !== prev.currentCFI;

      if (hasPageChanged) {
        if (locationChangeTimeout.current) clearTimeout(locationChangeTimeout.current);
        locationChangeTimeout.current = setTimeout(() => {
          addToHistory(next);
        }, 5000);
      }

      return next;
    });
  }, [addToHistory]);

  const handleNavigate = (location: any) => {
    setJumpLocation(location);
    loadBookmarks();
    loadQuotes();
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col h-screen transition-colors duration-300",
      readerTheme === 'dark' ? 'bg-gray-950 text-gray-100' :
        readerTheme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' :
          'bg-background text-foreground'
    )}>
      {/* Header */}
      <header className={cn(
        "h-14 border-b flex items-center justify-between px-4 z-10 transition-colors",
        readerTheme === 'dark' ? 'bg-gray-900 border-gray-800' :
          readerTheme === 'sepia' ? 'bg-[#efe6ce] border-[#e0d6bc]' :
            'bg-background'
      )}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/library" passHref>
            <Button variant="ghost" size="icon" aria-label="Back to library">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold truncate max-w-[200px] md:max-w-md" title={title}>
            {cleanBookTitle(title)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ReaderNavigation
            totalPages={currentLocation.totalPages}
            currentPage={currentLocation.currentPage}
            currentCFI={currentLocation.currentCFI}
            bookmarks={bookmarks}
            history={history}
            toc={toc}
            quotes={quotes}
            onNavigate={handleNavigate}
            bookId={bookId}
            bookTitle={title}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={isBookmarking ? 'text-blue-500 bg-blue-50/10' : ''}
            title="Bookmark this page"
          >
            <Bookmark className={cn(
              "h-5 w-5 transition-all duration-300",
              isBookmarking ? "fill-current scale-125" : (isBookmarked ? "fill-current opacity-80" : "")
            )} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Reader settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childElement = child as ReactElement<any>;
            return React.cloneElement(childElement, {
              readerTheme,
              onLocationUpdate: handleLocationUpdate,
              onMetadata: handleMetadataUpdate,
              onSaveHighlight: handleSaveHighlight,
              bookTitle: title,
              initialPage: jumpLocation?.page || childElement.props.initialPage,
              initialLocation: jumpLocation?.cfi || jumpLocation?.progress || childElement.props.initialLocation,
            });
          }
          return child;
        })}
        {showSettings && (
          <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
            <ReaderSettings
              onThemeChange={handleThemeChange}
              currentTheme={readerTheme}
            />
          </div>
        )}
      </main>
    </div>
  );
}
