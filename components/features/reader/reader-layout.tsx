'use client';

import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Bookmark, Settings } from 'lucide-react';
import Link from 'next/link';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ReaderNavigation } from '@/components/features/reader/reader-navigation';
import { ReaderSettings } from '@/components/features/reader/reader-settings';
import { Button } from '@/components/ui/button';

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
}

export function ReaderLayout({ children, title, bookId, userId }: ReaderLayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [currentLocation, setCurrentLocation] = useState<LocationData>({});
  const [history, setHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
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

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('reading_progress')
      .select('last_pages')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.last_pages) {
      setHistory(data.last_pages);
    }
  }, [supabase, bookId, userId]);

  // Load bookmark status
  const loadBookmark = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading bookmark:', error);
        return;
      }

      if (data) {
        setIsBookmarked(true);
      }

      // Load all bookmarks for this book to show in navigation
      const { data: allBookmarks } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (allBookmarks) {
        setBookmarks(allBookmarks.map((b: any) => ({
          id: b.id,
          label: b.page_number ? `Page ${b.page_number}` : 'Bookmarked Location',
          subLabel: b.note || new Date(b.created_at).toLocaleDateString(),
          data: { page: b.page_number, cfi: b.epub_cfi, progress: b.progress_percentage }
        })));
      }
    } catch (error) {
      console.error('Failed to load bookmark:', error);
      toast.error('Failed to load bookmark status');
    }
  }, [bookId, userId, supabase]);

  const handleMetadataUpdate = useCallback((data: { toc: any[] }) => {
    if (data.toc) {
      setToc(data.toc);
    }
  }, []);

  useEffect(() => {
    loadBookmark();
    loadHistory();
  }, [loadBookmark, loadHistory]);

  const addToHistory = useCallback((location: LocationData) => {
    if (!location.currentPage && !location.currentCFI) return;

    const label = location.currentPage ? `Page ${location.currentPage}` : 'Recent Location';

    setHistory(prev => {
      // Don't add if same as last history item
      if (prev.length > 0 && prev[0].label === label) return prev;

      const newHistoryItem = {
        id: Date.now(),
        label,
        data: { ...location },
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newHistoryItem, ...prev.filter(h => h.label !== label)].slice(0, 10);

      // Persist
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
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('book_id', bookId)
          .eq('user_id', userId);

        if (error) throw error;

        setIsBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        const { error } = await supabase.from('bookmarks').upsert(
          {
            book_id: bookId,
            user_id: userId,
            page_number: currentLocation.currentPage,
            epub_cfi: currentLocation.currentCFI,
            progress_percentage: currentLocation.progressPercentage,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'book_id,user_id',
          }
        );

        if (error) throw error;

        setIsBookmarked(true);
        toast.success('Bookmark saved');
      }
      loadBookmark(); // Refresh navigation lists
    } catch (error) {
      console.error('Bookmark operation failed:', error);
      toast.error(`Failed to ${isBookmarked ? 'remove' : 'save'} bookmark`);
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
    } catch (error) {
      console.error('Save highlight error:', error);
      toast.error('Failed to save highlight');
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'sepia') => {
    setReaderTheme(theme);
    supabase
      .from('user_preferences')
      .upsert({ user_id: userId, reader_theme: theme }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.error('Failed to save theme preference:', error);
      });
  };

  const handleLocationUpdate = useCallback((data: LocationData) => {
    setCurrentLocation((prev) => {
      const next = { ...prev, ...data };

      // Only update history if page/cfi actually changed
      if (next.currentPage !== prev.currentPage || next.currentCFI !== prev.currentCFI) {
        if (locationChangeTimeout.current) clearTimeout(locationChangeTimeout.current);
        locationChangeTimeout.current = setTimeout(() => {
          addToHistory(next);
        }, 5000); // 5 seconds on a page counts as "visited"
      }

      return next;
    });
  }, [addToHistory]);

  const handleNavigate = (data: any) => {
    // When manually navigating, we add the current location to history immediately
    addToHistory(currentLocation);
    setJumpLocation(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/library" passHref>
            <Button variant="ghost" size="icon" aria-label="Back to library">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold truncate max-w-[200px] md:max-w-md" title={title}>
            {title}
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
            onNavigate={handleNavigate}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={isBookmarked ? 'text-primary' : ''}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Reader settings"
            aria-expanded={showSettings}
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
          <div className="absolute top-4 right-4 z-50">
            <ReaderSettings onThemeChange={handleThemeChange} currentTheme={readerTheme} />
          </div>
        )}
      </main>
    </div>
  );
}
