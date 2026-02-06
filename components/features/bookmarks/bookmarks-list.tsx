'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Bookmark, BookOpen, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
    <div className="space-y-6">
      {Object.entries(groupedBookmarks).map(([bookId, { book, bookmarks: bookBookmarks }]) => (
        <Card key={bookId}>
          <CardContent className="p-6">
            {/* Book Header */}
            <div className="flex gap-4 mb-4 pb-4 border-b">
              <div className="w-16 h-24 rounded overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                {book.cover_url && !book.cover_url.startsWith('gradient:') ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white opacity-80" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg line-clamp-2">{book.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-secondary px-2 py-1 rounded uppercase">
                    {book.format}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {bookBookmarks.length} bookmark{bookBookmarks.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Bookmarks List */}
            <div className="space-y-3">
              {bookBookmarks.slice(0, 1).map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Bookmark className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium text-sm">{formatLocation(bookmark)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Saved {formatDate(bookmark.created_at)}</span>
                    </div>
                    {bookmark.note && (
                      <p className="text-sm text-muted-foreground mt-2 italic">"{bookmark.note}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={buildReaderUrl(bookmark)}>
                      <Button size="sm" variant="default">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Read
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => deleteBookmark(bookmark.id)}>
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
