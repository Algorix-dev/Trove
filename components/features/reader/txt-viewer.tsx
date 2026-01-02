'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useRef, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { GamificationService } from '@/lib/gamification';

interface TxtViewerProps {
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
}

export function TxtViewer({
  url,
  initialLocation,
  onLocationChange,
  readerTheme = 'light',
  userId,
  bookId,
  onLocationUpdate,
}: TxtViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Theme styles
  const themeStyles = {
    light: {
      background: 'bg-white',
      color: 'text-gray-900',
    },
    dark: {
      background: 'bg-gray-900',
      color: 'text-gray-100',
    },
    sepia: {
      background: 'bg-[#f6f1d1]',
      color: 'text-[#5f4b32]',
    },
  };
  const currentTheme = themeStyles[readerTheme];

  // Track reading time and award XP
  useEffect(() => {
    let sessionStart = Date.now();

    const interval = setInterval(async () => {
      if (!loading && content) {
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
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, loading, content, bookId]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(url);
        const text = await response.text();
        setContent(text);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load text file:', error);
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  // Restore scroll position
  useEffect(() => {
    if (!loading && initialLocation && scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement;
      if (viewport) {
        viewport.scrollTop = Number(initialLocation);
      }
    }
  }, [loading, initialLocation]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

    if (onLocationChange) {
      onLocationChange(scrollTop.toString(), progress);
    }

    // Notify parent about location change
    if (onLocationUpdate) {
      onLocationUpdate({
        progressPercentage: progress,
      });
    }

    saveProgress(progress);
  };

  const saveProgress = async (progressValue: number) => {
    // Debounce could be good here but keeping it simple first
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    // Only save if progress changed significantly?
    // Or assume component state updates are frequent.
    // We really should debounce this.

    await supabase.from('reading_progress').upsert(
      {
        book_id: bookId,
        user_id: userId,
        current_page: 0,
        progress_percentage: progressValue,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'book_id,user_id',
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full ${currentTheme.background} ${currentTheme.color} transition-colors duration-300`}
    >
      <ScrollArea
        className="h-full w-full px-4 md:px-8 py-8"
        ref={scrollRef}
        onScrollCapture={handleScroll}
      >
        <div className="max-w-3xl mx-auto font-serif text-lg leading-relaxed whitespace-pre-wrap pb-20">
          {content}
        </div>
      </ScrollArea>
    </div>
  );
}
