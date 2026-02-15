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

      if (allBookmarks) {
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

  // Reactive bookmark check based on current location
  useEffect(() => {
    const hasCurrentBookmark = bookmarks.some((b: any) => {
      // For PDF/TXT we check page_number
      if (currentLocation.currentPage && b.data.page === currentLocation.currentPage) return true;
      // For EPUB we check CFI
      if (currentLocation.currentCFI && b.data.cfi === currentLocation.currentCFI) return true;
      return false;
    });
    setIsBookmarked(hasCurrentBookmark);
  }, [currentLocation.currentPage, currentLocation.currentCFI, bookmarks]);

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
          data: { ...q, progress: q.progress_percentage, cfi: (q.selection_data as any)?.cfi }
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

    // Calculate updated history BEFORE setting state to avoid race conditions with upsert
    let updatedHistory: any[] = [];
    setHistory(prev => {
      const existingIndex = prev.findIndex(h => h.label === label);
      if (existingIndex !== -1) {
        const existingItem = { ...prev[existingIndex], timestamp: newHistoryItem.timestamp };
        updatedHistory = [existingItem, ...prev.filter((_, i) => i !== existingIndex)].slice(0, 20);
      } else {
        updatedHistory = [newHistoryItem, ...prev].slice(0, 20);
      }
      return updatedHistory;
    });

    // We must wait a tick or use a ref if we want to BE CERTAIN updatedHistory is set, 
    // but in a functional update, it should be synchronous within this scope.
    // However, to be absolutely safe, let's calculate it once and reuse.
    const calculateNewHistory = (prev: any[]) => {
      const existingIndex = prev.findIndex(h => h.label === label);
      if (existingIndex !== -1) {
        const existingItem = { ...prev[existingIndex], timestamp: newHistoryItem.timestamp };
        return [existingItem, ...prev.filter((_, i) => i !== existingIndex)].slice(0, 20);
      } else {
        return [newHistoryItem, ...prev].slice(0, 20);
      }
    };

    // PERSIST UPDATED HISTORY & PROGRESS TO DB
    try {
      const currentHistory = calculateNewHistory(history);

      await supabase
        .from('reading_progress')
        .upsert({
          book_id: bookId,
          user_id: userId,
          last_pages: currentHistory,
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
      console.error('Failed to commit progress to database:', error);
    }
  }, [bookId, userId, supabase, isTabVisible, history]);

  // STABILITY TIMER (5s)
  useEffect(() => {
    if (locationChangeTimeout.current) clearTimeout(locationChangeTimeout.current);

    // Only set timer if we have valid location data and it's DIFFERENT from what we last saved
    // to avoid constant resets while just idling or scrolling slightly
    const hasData = currentLocation.currentPage || currentLocation.currentCFI || currentLocation.progressPercentage;
    const isDifferent = currentLocation.currentPage !== history[0]?.data?.currentPage ||
      currentLocation.currentCFI !== history[0]?.data?.currentCFI;

    if (isTabVisible && !showSettings && hasData && isDifferent) {
      locationChangeTimeout.current = setTimeout(() => {
        addToHistory(currentLocation);
      }, 5000);
    }

    return () => {
      if (locationChangeTimeout.current) clearTimeout(locationChangeTimeout.current);
    };
  }, [currentLocation, isTabVisible, showSettings, addToHistory, history]);

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

      // 1. Check if we already have a bookmark for THIS specific location
      const existing = bookmarks.find(b => {
        if (currentLocation.currentPage && b.data.page === currentLocation.currentPage) return true;
        if (currentLocation.currentCFI && b.data.cfi === currentLocation.currentCFI) return true;
        return false;
      });

      if (existing) {
        // REMOVE it
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        toast.success('Bookmark removed');
      } else {
        // ADD it
        const { error } = await supabase.from('bookmarks').insert({
          book_id: bookId,
          user_id: userId,
          page_number: currentLocation.currentPage || 0,
          epub_cfi: currentLocation.currentCFI || '',
          progress_percentage: currentLocation.progressPercentage || 0,
        });

        if (error) throw error;
        toast.success('Bookmark saved');
      }

      loadBookmarks();
      setTimeout(() => setIsBookmarking(false), 800);
    } catch (error) {
      console.error('Bookmark operation failed:', error);
      toast.error('Operation failed');
      setIsBookmarking(false);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Bookmark deleted');
      loadBookmarks();
    } catch (error) {
      console.error('Delete bookmark failed:', error);
      toast.error('Failed to delete bookmark');
    }
  };

  const handleSaveHighlight = async (data: any) => {
    try {
      const { error } = await supabase.from('book_quotes').insert({
        user_id: userId,
        book_id: bookId,
        quote_text: data.quote_text || 'Annotated Note',
        page_number: data.page_number || currentLocation.currentPage || 0,
        chapter: data.chapter || 'Current Chapter',
        note: data.note,
        color: data.color || '#fef08a',
        highlight_type: data.highlight_type || 'highlight',
        selection_data: data.selection_data || {},
        progress_percentage: data.progress_percentage || currentLocation.progressPercentage || 0,
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

  const themeStyles = useMemo(() => {
    switch (readerTheme) {
      case 'dark':
        return {
          '--reader-bg': '#1a1b1e',
          '--reader-bg-secondary': '#1e1f23',
          '--reader-text': '#d1d5db',
          '--reader-text-muted': '#9ca3af',
          '--reader-border': '#2d2e32',
          '--reader-accent': '#3b82f6',
        } as React.CSSProperties;
      case 'sepia':
        return {
          '--reader-bg': '#f4efe1',
          '--reader-bg-secondary': '#ebe3cf',
          '--reader-text': '#433422',
          '--reader-text-muted': '#705d45',
          '--reader-border': '#dcd6bc',
          '--reader-accent': '#92400e',
        } as React.CSSProperties;
      case 'night':
        return {
          '--reader-bg': '#0a0a0b',
          '--reader-bg-secondary': '#0d0d0f',
          '--reader-text': '#9ca3af',
          '--reader-text-muted': '#6b7280',
          '--reader-border': '#1f1f23',
          '--reader-accent': '#6366f1',
        } as React.CSSProperties;
      default:
        return {
          '--reader-bg': '#ffffff',
          '--reader-bg-secondary': '#ffffff',
          '--reader-text': '#1a1c1e',
          '--reader-text-muted': '#64748b',
          '--reader-border': '#e2e8f0',
          '--reader-accent': '#2563eb',
        } as React.CSSProperties;
    }
  }, [readerTheme]);

  return (
    <div
      style={themeStyles}
      className="fixed inset-0 z-[100] flex flex-col h-screen transition-colors duration-300 text-[var(--reader-text)]"
    >
      {/* Header */}
      <header className="h-14 border-b border-[var(--reader-border)] flex items-center justify-between px-4 z-10 transition-colors bg-[var(--reader-bg-secondary)]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/library" passHref>
            <Button variant="ghost" size="icon" aria-label="Back to library" className="hover:bg-[var(--reader-accent)]/10">
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
            onDeleteBookmark={handleDeleteBookmark}
            userId={userId}
            bookId={bookId}
            bookTitle={title}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={cn(
              "hover:bg-[var(--reader-accent)]/10",
              isBookmarking ? 'text-blue-500 bg-blue-50/10' : ''
            )}
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
            className="hover:bg-[var(--reader-accent)]/10"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative transition-colors duration-300 bg-[var(--reader-bg)]">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childElement = child as ReactElement<any>;
            return React.cloneElement(childElement, {
              readerTheme,
              onLocationUpdate: handleLocationUpdate,
              onSaveHighlight: handleSaveHighlight,
              bookTitle: title,
              initialPage: jumpLocation?.page || jumpLocation?.page_number || childElement.props.initialPage,
              initialLocation: jumpLocation?.cfi || jumpLocation?.progress || jumpLocation?.progress_percentage || childElement.props.initialLocation,
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
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[var(--reader-accent)] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 animate-in slide-in-from-bottom-8 fade-in duration-500">
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
                className="h-8 px-4 text-xs font-bold rounded-lg shadow-sm hover:scale-105 transition-transform bg-white text-[var(--reader-accent)] hover:bg-white/90"
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
                className="h-8 px-2 text-xs opacity-60 hover:opacity-100 text-white hover:bg-white/10"
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
