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
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia' | 'night' | 'custom'>('light');
  const [currentLocation, setCurrentLocation] = useState<LocationData>({});
  const [history, setHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<any>(null);
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

  // Use visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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

      const savedPos = {
        page: data.current_page,
        cfi: data.epub_cfi,
        progress: data.progress_percentage
      };

      // If we have saved progress, ask to restore
      if (savedPos.page || savedPos.cfi || savedPos.progress) {
        setPendingRestore(savedPos);
        setShowRestorePrompt(true);
      }
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


  useEffect(() => {
    loadInitialSettings();
    loadBookmarks();
    loadQuotes();
    loadInitialProgress();
  }, [loadInitialSettings, loadBookmarks, loadQuotes, loadInitialProgress]);

  const addToHistory = useCallback(async (location: LocationData) => {
    // Only save if tab is active and we have meaningful data
    if (!isTabVisible || (!location.currentPage && !location.currentCFI && !location.progressPercentage)) return;

    const label = location.currentPage ? `Page ${location.currentPage}` :
      location.progressPercentage ? `${Math.round(location.progressPercentage)}% Progress` :
        'Recent Location';

    const newHistoryItem = {
      id: Date.now(),
      label,
      data: { ...location },
      timestamp: new Date().toISOString()
    };

    setHistory(prev => {
      const existingIndex = prev.findIndex(h => h.label === label);
      if (existingIndex !== -1) {
        const existingItem = { ...prev[existingIndex], timestamp: newHistoryItem.timestamp };
        return [existingItem, ...prev.filter((_, i) => i !== existingIndex)].slice(0, 20);
      } else {
        return [newHistoryItem, ...prev].slice(0, 20);
      }
    });

    // COMMIT STABLE PROGRESS
    try {
      await supabase
        .from('reading_progress')
        .upsert({
          book_id: bookId,
          user_id: userId,
          current_page: location.currentPage,
          epub_cfi: location.currentCFI,
          progress_percentage: location.progressPercentage,
          updated_at: new Date().toISOString()
        }, { onConflict: 'book_id,user_id' });

      // Mirror to books table for library view
      await supabase
        .from('books')
        .update({
          progress_percentage: location.progressPercentage,
          current_page: location.currentPage,
          last_read_at: new Date().toISOString(),
        })
        .eq('id', bookId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to commit progress:', error);
    }
  }, [bookId, userId, supabase, isTabVisible]);

  // STABILITY TIMER (5s)
  useEffect(() => {
    if (locationChangeTimeout.current) clearTimeout(locationChangeTimeout.current);

    if (isTabVisible && !showSettings && (currentLocation.currentPage || currentLocation.currentCFI || currentLocation.progressPercentage)) {
      locationChangeTimeout.current = setTimeout(() => {
        addToHistory(currentLocation);
      }, 5000);
    }

    return () => {
      if (locationChangeTimeout.current) clearTimeout(locationChangeTimeout.current);
    };
  }, [currentLocation, isTabVisible, showSettings, addToHistory]);

  const handleLocationUpdate = useCallback((data: LocationData) => {
    setCurrentLocation((prev) => ({ ...prev, ...data }));
  }, []);

  const handleNavigate = (location: any) => {
    setJumpLocation(location);
    setShowRestorePrompt(false);
    loadBookmarks();
    loadQuotes();
  };

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
        progress_percentage: data.progress_percentage || currentLocation.progressPercentage,
      });

      if (error) throw error;
      toast.success('Highlight saved!');
      loadQuotes();
    } catch (error) {
      console.error('Save highlight error:', error);
      toast.error('Failed to save highlight');
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'sepia' | 'night' | 'custom') => {
    setReaderTheme(theme);
    supabase
      .from('user_preferences')
      .upsert({ user_id: userId, reader_theme: theme, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.error('Failed to save theme preference:', error);
      });
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col h-screen transition-colors duration-300",
      readerTheme === 'dark' ? 'bg-[#1a1b1e] text-[#d1d5db]' :
        readerTheme === 'sepia' ? 'bg-[#f4efe1] text-[#433422]' :
          readerTheme === 'night' ? 'bg-[#0a0a0b] text-[#9ca3af]' :
            'bg-[#ffffff] text-[#1a1c1e]'
    )}>
      {/* Header */}
      <header className={cn(
        "h-14 border-b flex items-center justify-between px-4 z-10 transition-colors",
        readerTheme === 'dark' ? 'bg-[#1e1f23] border-[#2d2e32]' :
          readerTheme === 'sepia' ? 'bg-[#ebe3cf] border-[#dcd6bc]' :
            readerTheme === 'night' ? 'bg-[#0d0d0f] border-[#1f1f23]' :
              'bg-[#ffffff] border-[#e2e8f0]'
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
            quotes={quotes}
            onNavigate={handleNavigate}
            userId={userId}
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

        {/* Restore Progress Prompt */}
        {showRestorePrompt && pendingRestore && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-2xl border border-primary/20 animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">Pick up where you left off?</span>
              <span className="text-[10px] opacity-80 uppercase tracking-wider font-bold">
                {pendingRestore.page ? `Page ${pendingRestore.page}` :
                  pendingRestore.progress ? `${Math.round(pendingRestore.progress)}% done` : 'Last Position'}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-4 text-xs font-bold rounded-lg shadow-sm hover:scale-105 transition-transform"
                onClick={() => {
                  handleNavigate(pendingRestore);
                  setShowRestorePrompt(false);
                }}
              >
                Restore
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs opacity-60 hover:opacity-100"
                onClick={() => setShowRestorePrompt(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
