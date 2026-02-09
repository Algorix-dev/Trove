'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { GamificationService } from '@/lib/gamification';
import { cn } from '@/lib/utils';

export interface TxtViewerProps {
  url: string;
  bookId: string;
  userId: string;
  bookTitle: string;
  author?: string;
  fontSize?: number;
  readerTheme?: 'light' | 'dark' | 'sepia';
  initialLocation?: number;
  onLocationUpdate?: (data: { progressPercentage: number }) => void;
  onSaveHighlight?: (data: any) => void;
}

export function TxtViewer({
  url,
  bookId,
  userId,
  bookTitle,
  author,
  fontSize = 100,
  readerTheme = 'light',
  initialLocation,
  onLocationUpdate,
  onSaveHighlight,
}: TxtViewerProps) {
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!url) return;
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch TXT content');
        const text = await response.text();
        setContent(text);

        if (initialLocation !== undefined) {
          setProgress(initialLocation);
        } else {
          await loadInitialProgress();
        }
      } catch (err) {
        console.error('Error fetching TXT:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url, bookId, userId]);

  const loadInitialProgress = async () => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    const { data } = await supabase
      .from('reading_progress')
      .select('progress_percentage')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.progress_percentage) {
      setProgress(data.progress_percentage);
    }
  };

  const saveProgress = async (val: number) => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );
    await supabase.from('reading_progress').upsert({
      user_id: userId,
      book_id: bookId,
      progress_percentage: val,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' });
  };

  const themeStyles = {
    light: {
      background: 'bg-white',
      text: 'text-slate-900',
      border: 'border-slate-200'
    },
    dark: {
      background: 'bg-slate-950',
      text: 'text-slate-100',
      border: 'border-slate-800'
    },
    sepia: {
      background: 'bg-[#f4ecd8]',
      text: 'text-[#5b4636]',
      border: 'border-[#e0d6bc]'
    }
  };

  const currentTheme = themeStyles[readerTheme];

  // Robust Heartbeat Activity Tracking
  useEffect(() => {
    if (!content) return;

    let startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 55000) { // Approx 1 min
        const supabase = createBrowserClient(
          process.env['NEXT_PUBLIC_SUPABASE_URL']!,
          process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
        );

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
  }, [userId, bookId, content]);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const currentScroll = target.scrollTop;
    const scrollPercent = maxScroll > 0 ? Math.round((currentScroll / maxScroll) * 100) : 0;

    if (scrollPercent !== progress) {
      setProgress(scrollPercent);
      if (onLocationUpdate) {
        onLocationUpdate({ progressPercentage: scrollPercent });
      }
      saveProgress(scrollPercent);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", currentTheme.background)}>
      <ScrollArea
        className="flex-1 px-8 py-10"
        onScrollCapture={handleScroll}
        onMouseUp={handleMouseUp}
      >
        <div
          className={cn("max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap font-serif text-lg", currentTheme.text)}
          style={{ fontSize: `${(fontSize / 100) * 1.125}rem` }}
        >
          {content}
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
              author={author}
              onSave={async (data) => {
                await onSaveHighlight({ ...data, progress_percentage: progress });
                setSelection(null);
              }}
              onClose={() => setSelection(null)}
            />
          </div>
        )}
      </ScrollArea>

      <div className={cn("h-8 border-t flex items-center justify-center text-xs transition-colors", currentTheme.background, currentTheme.text, currentTheme.border, "opacity-70")}>
        {progress}% Read
      </div>
    </div>
  );
}
