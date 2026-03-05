'use client';

import { createBrowserClient } from '@supabase/ssr';
import { BookOpen, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cleanBookTitle } from '@/lib/utils';

interface ContinueReadingBook {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  current_page: number;
  total_pages: number;
  progress_percentage?: number;
}



export function ContinueReading() {
  const [book, setBook] = useState<ContinueReadingBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLastReadBook = async () => {
      const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get most recently updated book from reading_progress
      const { data } = await supabase
        .from('reading_progress')
        .select(
          `
                    current_page,
                    progress_percentage,
                    books (
                        id,
                        title,
                        author,
                        cover_url,
                        total_pages
                    )
                `
        )
        .eq('user_id', user.id)
        .gt('progress_percentage', 0)
        .lt('progress_percentage', 100)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.books) {
        const bookData = Array.isArray(data.books) ? data.books[0] : data.books;

        // Use current_page if available, otherwise estimate from progress
        const totalPages = bookData.total_pages || 0;
        const currentPage = data.current_page ||
          (totalPages > 0 ? Math.round((data.progress_percentage / 100) * totalPages) : 0);

        setBook({
          id: bookData.id,
          title: bookData.title,
          author: bookData.author,
          cover_url: bookData.cover_url,
          current_page: currentPage,
          total_pages: totalPages,
          progress_percentage: data.progress_percentage,
        });
      }

      setLoading(false);
    };

    fetchLastReadBook();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Continue Reading</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!book) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Continue Reading</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">No books in progress. Start reading to see your progress here!</p>
        </CardContent>
      </Card>
    );
  }

  const progress =
    book.progress_percentage ||
    (book.total_pages > 0 ? Math.round((book.current_page / book.total_pages) * 100) : 0);
  const isGradient = book.cover_url?.startsWith('gradient:');
  const gradientStyle = isGradient ? book.cover_url?.replace('gradient:', '') : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
          Current Expedition
        </h3>
      </div>
      <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="h-44 w-32 rounded-3xl flex-shrink-0 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
              {isGradient ? (
                <div
                  className="w-full h-full flex items-center justify-center text-white p-4"
                  style={{ background: gradientStyle || '' }}
                >
                  <BookOpen className="h-10 w-10 opacity-90 shadow-sm" />
                </div>
              ) : book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between flex-1 py-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                    In Progress
                  </span>
                  {book.total_pages > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {book.total_pages - book.current_page} pages left
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-none pt-1">
                  {cleanBookTitle(book.title)}
                </h3>
                <p className="text-muted-foreground font-medium">{book.author}</p>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Reading Progress</p>
                    <p className="text-xl font-black">
                      {progress}% <span className="text-xs font-bold text-muted-foreground/40 ml-1">COMPLETED</span>
                    </p>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    {book.current_page} / {book.total_pages || '---'}
                  </p>
                </div>

                <div className="relative h-3 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Link href={`/dashboard/reader/${book.id}`} className="flex-1">
                    <Button className="w-full h-12 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                      <PlayCircle className="h-5 w-5" /> Resume Journey
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
