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
import { GamificationService } from '@/lib/gamification';

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
  initialLocation?: any;
}

export function ReaderLayout({ children, title, bookId, userId, initialLocation: propLocation }: ReaderLayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia' | 'night' | 'custom'>('light');
  const [currentLocation, setCurrentLocation] = useState<LocationData>({});
  const [history, setHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [jumpLocation, setJumpLocation] = useState<any>(propLocation || null);
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
    // Check if we are already navigating somewhere from a URL bookmark
    const hasInitialNav = jumpLocation?.page || jumpLocation?.cfi || jumpLocation?.progress ||
      (typeof jumpLocation === 'number' && jumpLocation > 0) ||
      (typeof jumpLocation === 'string' && jumpLocation.length > 5);

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

      // "START FROM BEGINNING" LOGIC
      // If no initial URL navigation, we start at 0 but offer to resume
      if (!hasInitialNav && (savedPos.page || savedPos.cfi || savedPos.progress)) {
        toast('Resume Reading?', {
          description: `You were at ${savedPos.page ? 'page ' + savedPos.page : Math.round((savedPos.progress || 0) * 100) + '%'} last time.`,
          action: {
            label: 'Jump to Page',
            onClick: () => {
              setJumpLocation(savedPos.cfi || savedPos.progress || savedPos.page);
            }
          },
          duration: 10000,
        });
      }
    }
  }, [supabase, bookId, userId, jumpLocation]);

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
            day: 'numeric'
          });
          const time = new Date(b.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          const label = b.page_number && b.page_number > 0 ? `Page ${b.page_number}` :
            b.progress_percentage && b.progress_percentage > 0 ? `${Math.round(b.progress_percentage)}%` :
              'Bookmarked';

          return {
            id: b.id,
            label: `${label} - ${date}, ${time}`,
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
      // 1. Precise CFI Match (EPUB)
      if (currentLocation.currentCFI && b.data.cfi === currentLocation.currentCFI) return true;

      // 2. Page Number Match (PDF/TXT/EPUB Fallback)
      if (currentLocation.currentPage && b.data.page === currentLocation.currentPage && currentLocation.currentPage > 0) return true;

      // 3. Progress Percentage Match (TXT/Fallback)
      if (currentLocation.progressPercentage && b.data.progress && !currentLocation.currentPage) {
        return Math.abs(currentLocation.progressPercentage - b.data.progress) < 0.5;
      }

      return false;
    });
    setIsBookmarked(hasCurrentBookmark);
  }, [currentLocation.currentPage, currentLocation.currentCFI, currentLocation.progressPercentage, bookmarks]);

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
        const time = new Date(q.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

        const label = q.page_number ? `Page ${q.page_number}` : q.chapter || 'Highlight';

        return {
          id: q.id,
          label: `${label} - ${date}, ${time}`,
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

    // Refresh streak immediately on open
    GamificationService.refreshStreak(userId);
  }, [loadInitialSettings, loadBookmarks, loadQuotes, loadInitialProgress, userId]);

  const addToHistory = useCallback(async (location: LocationData) => {
    // Only save if tab is active and we have meaningful data
    if (!isTabVisible || (!location.currentPage && !location.currentCFI && !location.progressPercentage)) return;

    // Validate data to prevent NaN
    const curPage = typeof location.currentPage === 'number' && !isNaN(location.currentPage) ? location.currentPage : 0;
    const progress = typeof location.progressPercentage === 'number' && !isNaN(location.progressPercentage) ? location.progressPercentage : 0;

    const labelText = curPage > 0 ? `Page ${curPage}` :
      progress > 0 ? `${Math.round(progress)}% Progress` :
        'Recent Location';

    // Use functional update to ensure we have the latest history
    setHistory(prev => {
      // Create a unique label including time to avoid folding distinct visits into one history item
      const timestampLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fullLabel = `${labelText} (${timestampLabel})`;

      const newHistoryItem = {
        id: Date.now(),
        label: fullLabel,
        data: { ...location, currentPage: curPage, progressPercentage: progress },
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newHistoryItem, ...prev.filter(h => h.label !== fullLabel)].slice(0, 20);

      // PERSIST UPDATED HISTORY & PROGRESS TO DB
      // We do this inside a separate function or after the tick, 
      // but for simplicity and reliability here, we use the calculated value.
      (async () => {
        try {
          await supabase
            .from('reading_progress')
            .upsert({
              book_id: bookId,
              user_id: userId,
              last_pages: updatedHistory,
              current_page: curPage,
              epub_cfi: location.currentCFI,
              progress_percentage: progress,
              updated_at: new Date().toISOString()
            }, { onConflict: 'book_id,user_id' });

          // Mirror to books table for library view
          await supabase
            .from('books')
            .update({
              progress_percentage: progress,
              current_page: curPage,
              last_read_at: new Date().toISOString(),
            })
            .eq('id', bookId)
            .eq('user_id', userId);
        } catch (error) {
          console.error('Failed to commit progress to database:', error);
        }
      })();

      return updatedHistory;
    });
  }, [bookId, userId, supabase, isTabVisible]);

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

  const handleLocationUpdate = useCallback(async (data: LocationData) => {
    setCurrentLocation((prev) => ({ ...prev, ...data }));

    // Auto-save progress to DB (debounced/throttled via the stability timer logic elsewhere, 
    // but we can also do a direct save here for absolute certainty on exit/nav)
    try {
      await supabase
        .from('reading_progress')
        .upsert({
          user_id: userId,
          book_id: bookId,
          current_page: data.currentPage || 0,
          epub_cfi: data.currentCFI || null,
          progress_percentage: data.progressPercentage || 0,
          last_read_at: new Date().toISOString()
        }, { onConflict: 'user_id,book_id' });
    } catch (e) {
      console.error('[ReaderLayout] Direct progress save failed:', e);
    }
  }, [supabase, userId, bookId]);

  const handleNavigate = (location: any) => {
    // Navigation priority: CFI (pinpoint) > Page (rough)
    const target = location?.cfi || location?.epub_cfi || location?.progress || location?.progress_percentage || location?.page || location?.page_number || location;
    if (target === undefined || target === null) return;

    console.log('[ReaderLayout] Navigating to:', target);
    setJumpLocation(target);

    // Reset jump location after a short delay to allow re-triggering the same location
    setTimeout(() => {
      setJumpLocation(null);
    }, 500);

    loadBookmarks();
    loadQuotes();
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;

    try {
      setIsBookmarking(true);

      // Validate location data to prevent NaN errors in Supabase
      const pageNum = typeof currentLocation.currentPage === 'number' && !isNaN(currentLocation.currentPage)
        ? currentLocation.currentPage
        : 0;
      const progressPercent = typeof currentLocation.progressPercentage === 'number' && !isNaN(currentLocation.progressPercentage)
        ? currentLocation.progressPercentage
        : 0;
      const epubCfi = currentLocation.currentCFI || '';

      // 1. Check if we already have a bookmark for THIS specific location
      // Using bookmarks list from state which is kept in sync
      const existing = bookmarks.find(b => {
        if (epubCfi && b.data.cfi === epubCfi) return true;
        if (pageNum > 0 && b.data.page === pageNum) return true;
        if (progressPercent > 0 && b.data.progress && !pageNum) {
          return Math.abs(progressPercent - b.data.progress) < 0.5;
        }
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
          page_number: pageNum,
          epub_cfi: epubCfi, // Captured from currentLocation.currentCFI
          progress_percentage: progressPercent,
        });

        if (error) throw error;
        toast.success('Bookmark saved');
      }

      await loadBookmarks();
    } catch (error: any) {
      console.error('Bookmark operation failed:', error);
      toast.error(`Operation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => setIsBookmarking(false), 500);
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
      // Guards for valid numbers
      const pageNum = typeof data.page_number === 'number' && !isNaN(data.page_number) ? data.page_number : (currentLocation.currentPage || 0);
      const progressPercent = typeof data.progress_percentage === 'number' && !isNaN(data.progress_percentage) ? data.progress_percentage : (currentLocation.progressPercentage || 0);

      const { error } = await supabase.from('book_quotes').insert({
        user_id: userId,
        book_id: bookId,
        quote_text: data.quote_text || 'Annotated Note',
        page_number: pageNum,
        chapter: data.chapter || 'Current Chapter',
        note: data.note,
        color: data.color || '#fef08a',
        highlight_type: data.highlight_type || 'highlight',
        selection_data: data.selection_data || {},
        progress_percentage: progressPercent,
      });

      if (error) throw error;
      toast.success(data.highlight_type === 'quote' ? 'Quote saved!' : 'Highlight saved!');
      loadQuotes();
    } catch (error: any) {
      console.error('Save highlight error:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
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
              initialPage: jumpLocation && (typeof jumpLocation === 'number' || !isNaN(parseInt(jumpLocation))) ? parseInt(jumpLocation) : (jumpLocation?.page || jumpLocation?.page_number || childElement.props.initialPage),
              initialLocation: jumpLocation && (typeof jumpLocation === 'string' && jumpLocation.length > 5) ? jumpLocation : (jumpLocation?.cfi || jumpLocation?.progress || jumpLocation?.progress_percentage || childElement.props.initialLocation),
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
