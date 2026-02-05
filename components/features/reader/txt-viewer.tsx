'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useRef, useState } from 'react';

import { HighlightMenu } from '@/components/features/reader/highlight-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GamificationService } from '@/lib/gamification';

interface TxtViewerProps {
  url: string;
  initialLocation?: string | number;
  onLocationChange?: (location: string, progress: number) => void;
  readerTheme?: 'light' | 'dark' | 'sepia';
  userId: string;
  bookId: string;
  bookTitle?: string;
  onLocationUpdate?: (data: {
    currentPage?: number;
    totalPages?: number;
    currentCFI?: string;
    progressPercentage?: number;
  }) => void;
  onMetadata?: (data: { toc: any[] }) => void;
  onSaveHighlight?: (data: any) => Promise<void>;
  author?: string;
  fontSize?: number;
}

export function TxtViewer({
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
}: TxtViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const themeStyles = {
    light: { background: 'bg-white', color: 'text-gray-900' },
    dark: { background: 'bg-gray-900', color: 'text-gray-100' },
    sepia: { background: 'bg-[#f6f1d1]', color: 'text-[#5f4b32]' },
  };
  const currentTheme = themeStyles[readerTheme];

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
          await supabase.from('reading_sessions').insert({
            user_id: userId,
            book_id: bookId,
            duration_minutes: 1,
            session_date: new Date().toISOString().split('T')[0],
          });
          await GamificationService.awardXP(userId, 1, 'Reading Time', bookId);
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
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const text = (await response.text()).replace(/\\n/g, '\n');
        setContent(text);
        setLoading(false);
        if (onMetadata) onMetadata({ toc: [] });
      } catch (error) {
        console.error('Failed to load text file:', error);
        setContent('Error: Failed to load text file.');
        setLoading(false);
      }
    };
    fetchContent();
  }, [url]);

  useEffect(() => {
    if (!loading && initialLocation && scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) viewport.scrollTop = Number(initialLocation);
    }
  }, [loading, initialLocation]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = Math.round((target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100);
    if (onLocationChange) onLocationChange(target.scrollTop.toString(), progress);
    if (onLocationUpdate) onLocationUpdate({ progressPercentage: progress });
    saveProgress(progress);
  };

  const saveProgress = async (progressValue: number) => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );
    await supabase.from('reading_progress').upsert(
      { book_id: bookId, user_id: userId, progress_percentage: progressValue, updated_at: new Date().toISOString() },
      { onConflict: 'book_id,user_id' }
    );
    await supabase.from('books').update({
      progress_percentage: progressValue,
      last_read_at: new Date().toISOString()
    }).eq('id', bookId).eq('user_id', userId);
  };

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

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className={`h-full w-full ${currentTheme.background} ${currentTheme.color} transition-colors duration-300 relative`} onMouseUp={handleMouseUp}>
      <ScrollArea className="h-full w-full px-4 md:px-8 py-8" ref={scrollRef} onScrollCapture={handleScroll}>
        <div
          className="max-w-3xl mx-auto font-serif leading-relaxed whitespace-pre-wrap pb-20"
          style={{ fontSize: `${(fontSize / 100) * 1.125}rem` }}
        >
          {content}
        </div>
      </ScrollArea>

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
            existingHighlight={(selection as any).id ? selection : undefined}
            onSave={onSaveHighlight}
            onClose={() => setSelection(null)}
          />
        </div>
      )}
    </div>
  );
}
