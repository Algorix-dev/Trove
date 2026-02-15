'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Bookmark, BookOpen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BookmarkData {
  id: string;
  book_id: string;
  page_number: number | null;
  epub_cfi: string | null;
  progress_percentage: number | null;
  created_at: string;
  note: string | null;
  books: {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    format: string;
  };
}

interface GroupedBookmarks {
  [bookId: string]: {
    book: BookmarkData['books'];
    bookmarks: BookmarkData[];
  };
}

export function BookmarksList({ userId }: { userId: string }) {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  useEffect(() => {
    fetchBookmarks();
  }, [userId]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(
        `
                id,
                book_id,
                page_number,
                epub_cfi,
                progress_percentage,
                created_at,
                note,
                books (
                    id,
                    title,
                    author,
                    cover_url,
                    format
                )
            `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } else {
      setBookmarks(data as any as BookmarkData[]);
    }
    setLoading(false);
  };

  const deleteBookmark = async (bookmarkId: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);

    if (error) {
      toast.error('Failed to delete bookmark');
    } else {
      toast.success('Bookmark removed');
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    }
  };

  // Group bookmarks by book
  const groupedBookmarks: GroupedBookmarks = bookmarks.reduce((acc, bookmark) => {
    const bookId = bookmark.book_id;
    if (!acc[bookId]) {
      acc[bookId] = {
        book: bookmark.books,
        bookmarks: [],
      };
    }
    acc[bookId].bookmarks.push(bookmark);
    return acc;
  }, {} as GroupedBookmarks);

  const formatLocation = (bookmark: BookmarkData) => {
    if (bookmark.page_number) {
      return `Page ${bookmark.page_number}`;
    }
    if (bookmark.progress_percentage !== null) {
      return `${bookmark.progress_percentage}% complete`;
    }
    return 'Unknown location';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const buildReaderUrl = (bookmark: BookmarkData) => {
    const baseUrl = `/dashboard/reader/${bookmark.book_id}`;
    const params = new URLSearchParams();

    if (bookmark.page_number) {
      params.set('page', bookmark.page_number.toString());
    } else if (bookmark.epub_cfi) {
      params.set('cfi', bookmark.epub_cfi);
    } else if (bookmark.progress_percentage) {
      params.set('progress', (bookmark.progress_percentage / 100).toString());
    }

    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
          <p className="text-muted-foreground mb-4">
            Bookmark pages while reading to quickly return to them later
          </p>
          <Link href="/dashboard/library">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Library
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
      {Object.entries(groupedBookmarks).map(([bookId, { book, bookmarks: bookBookmarks }]) => (
        <Card key={bookId} className="border-none shadow-2xl bg-card/30 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group/book hover:bg-card/40 transition-all duration-500">
          <CardContent className="p-0">
            {/* Book Header with immersive background */}
            <div className="relative p-6 border-b border-border/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
              <div className="relative flex gap-6 items-start">
                <div className="w-24 h-36 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border border-white/10 transition-transform duration-500 group-hover/book:scale-105">
                  {book.cover_url && !book.cover_url.startsWith('gradient:') ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-purple-600">
                      <BookOpen className="h-10 w-10 text-white opacity-80" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-2">
                  <h3 className="font-extrabold text-2xl line-clamp-2 tracking-tight mb-2 group-hover/book:text-primary transition-colors">{book.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground mb-4">{book.author}</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full px-3 py-1 bg-primary/5 border-primary/20 text-[10px] uppercase tracking-widest font-bold">
                      {book.format}
                    </Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {bookBookmarks.length} Saved Moment{bookBookmarks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookmarks List with scroll constraint if too many */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {bookBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="group/item flex items-center justify-between p-4 rounded-3xl border border-border/50 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Bookmark className="h-4 w-4 text-primary fill-primary/20" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block tracking-tight">{formatLocation(bookmark)}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Saved {formatDate(bookmark.created_at)}</span>
                      </div>
                    </div>
                    {bookmark.note && (
                      <div className="ml-11 relative">
                        <div className="absolute left-[-1.5rem] top-0 bottom-0 w-0.5 bg-primary/20 rounded-full" />
                        <p className="text-[13px] text-muted-foreground leading-relaxed italic">
                          "{bookmark.note}"
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={buildReaderUrl(bookmark)}>
                      <Button size="sm" variant="outline" className="h-10 w-10 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
