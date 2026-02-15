'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { GamificationService } from '@/lib/gamification';
import { toast } from 'sonner';
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

  const currentStyles = {
    background: 'bg-[var(--reader-bg)]',
    text: 'text-[var(--reader-text)]',
    border: 'border-[var(--reader-border)]'
  };

  // Robust Heartbeat Activity Tracking
  useEffect(() => {
    if (!content) return;

    let startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 55000) { // Approx 1 min
        // For TXT, we don't have pages, so we use progress as a proxy or just 0
        await GamificationService.awardXP(userId, 1, 'Reading Time', bookId, {
          startPage: 0,
          endPage: 0
        });

        startTime = Date.now();
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [userId, bookId, content]);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const text = selection.toString().trim();

    // Only proceed if selection is within our content area
    const container = range.commonAncestorContainer;
    const isInside = container.nodeType === 3 ? container.parentElement?.closest('.txt-content-area') : (container as HTMLElement).closest('.txt-content-area');

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const currentScroll = target.scrollTop;

    // Ensure we don't divide by zero and handle NaN
    let scrollPercent = 0;
    if (maxScroll > 0) {
      scrollPercent = Math.round((currentScroll / maxScroll) * 100);
    }

    if (!isNaN(scrollPercent) && scrollPercent !== progress) {
      setProgress(scrollPercent);
      if (onLocationUpdate) {
        onLocationUpdate({ progressPercentage: scrollPercent });
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", currentStyles.background)}>
      <ScrollArea
        className="flex-1 px-8 py-10"
        onScrollCapture={handleScroll}
      >
        <div
          className={cn("txt-content-area max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap font-serif text-lg", currentStyles.text)}
          style={{ fontSize: `${(fontSize / 100) * 1.125}rem` }}
        >
          {content}
        </div>

        {selection && onSaveHighlight && (
          <div
            className="fixed z-[300] -translate-x-1/2 -translate-y-full mb-4"
            style={{
              left: Math.max(120, Math.min(window.innerWidth - 120, selection.x)),
              top: Math.max(80, selection.y - 10)
            }}
          >
            <HighlightMenu
              selectedText={selection?.text || ''}
              bookId={bookId}
              bookTitle={bookTitle}
              author={author}
              readerTheme={readerTheme}
              onSave={async (data) => {
                if (selection) {
                  try {
                    await onSaveHighlight?.({ ...data, progress_percentage: progress });
                    setSelection(null);
                    window.getSelection()?.removeAllRanges();
                  } catch (err: any) {
                    console.error('Failed to save highlight in TxtViewer:', err);
                    toast.error(`Save failed: ${err.message || 'Unknown error'}`);
                  }
                }
              }}
              onClose={() => {
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
            />
          </div>
        )}
      </ScrollArea>

      <div className={cn("h-8 border-t flex items-center justify-center text-xs transition-colors", currentStyles.background, currentStyles.text, currentStyles.border, "opacity-70")}>
        {progress}% Read
      </div>
    </div>
  );
}
