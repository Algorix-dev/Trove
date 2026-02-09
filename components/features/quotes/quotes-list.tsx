'use client';

import { createBrowserClient } from '@supabase/ssr';
import {
  BookOpen,
  ExternalLink,
  Quote as QuoteIcon,
  Search,
  Star,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface BookQuote {
  id: string;
  quote_text: string;
  page_number: number | null;
  chapter: string | null;
  note: string | null;
  is_favorite: boolean;
  created_at: string;
  selection_data: any;
  progress_percentage?: number;
  books: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
  };
}

export function QuotesList({ userId }: { userId: string }) {
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  useEffect(() => {
    fetchQuotes();
  }, [userId]);

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('book_quotes')
      .select(
        `
        id,
        quote_text,
        page_number,
        chapter,
        note,
        is_favorite,
        created_at,
        selection_data,
        progress_percentage,
        books (
          id,
          title,
          author,
          cover_url
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setQuotes(data as any);
    }
    setLoading(false);
  };

  const toggleFavorite = async (quoteId: string, currentFavorite: boolean) => {
    const { error } = await supabase
      .from('book_quotes')
      .update({ is_favorite: !currentFavorite })
      .eq('id', quoteId);

    if (error) {
      toast.error('Failed to update favorite');
    } else {
      setQuotes(
        quotes.map((q) => (q.id === quoteId ? { ...q, is_favorite: !currentFavorite } : q))
      );
      toast.success(currentFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  const deleteQuote = async (quoteId: string) => {
    const { error } = await supabase.from('book_quotes').delete().eq('id', quoteId);

    if (error) {
      toast.error('Failed to delete quote');
    } else {
      setQuotes(quotes.filter((q) => q.id !== quoteId));
      toast.success('Quote deleted');
    }
  };

  const filteredQuotes = useMemo(() => {
    let result = filter === 'favorites' ? quotes.filter((q) => q.is_favorite) : quotes;
    if (searchQuery) {
      result = result.filter(q =>
        q.quote_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.books.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.note?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [quotes, filter, searchQuery]);

  // Group quotes by book
  const groupedQuotes = useMemo(() => {
    const groups: Record<string, { book: any; quotes: BookQuote[] }> = {};
    filteredQuotes.forEach(q => {
      const bookId = q.books.id;
      if (!groups[bookId]) {
        groups[bookId] = { book: q.books, quotes: [] };
      }
      groups[bookId].quotes.push(q);
    });
    return Object.values(groups);
  }, [filteredQuotes]);

  const getJumpUrl = (quote: BookQuote) => {
    const params = new URLSearchParams();
    if (quote.page_number) params.append('page', quote.page_number.toString());
    if (quote.selection_data?.cfi) params.append('cfi', quote.selection_data.cfi);
    if (quote.progress_percentage) params.append('progress', quote.progress_percentage.toString());

    return `/dashboard/reader/${quote.books.id}?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 border rounded-2xl p-6 animate-pulse bg-muted/20" />
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card className="p-16 text-center border-dashed rounded-3xl bg-muted/5">
        <QuoteIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
        <h3 className="text-2xl font-bold mb-3 tracking-tight">No Quotes Saved Yet</h3>
        <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
          Highlight beautiful passages in your books and they'll appear here automatically.
        </p>
        <Button asChild size="lg" className="rounded-xl h-12 px-8 font-bold">
          <Link href="/dashboard/library">
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Library
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${filter === 'all'
              ? 'bg-background shadow-sm text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            All Quotes
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${filter === 'favorites'
              ? 'bg-background shadow-sm text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Star className={`h-3.5 w-3.5 ${filter === 'favorites' ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            Favorites
          </button>
        </div>

        <div className="relative w-full sm:w-72 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search quotes, books, or notes..."
            className="pl-10 h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {groupedQuotes.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <p className="text-lg font-medium">No results found for your search.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedQuotes.map(({ book, quotes: bookQuotes }) => (
            <section key={book.id} className="space-y-6">
              <div className="flex items-end justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  {book.cover_url && (
                    <img
                      src={book.cover_url}
                      alt=""
                      className="h-12 w-8 object-cover rounded shadow-sm bg-muted"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
                  <Link href={`/dashboard/reader/${book.id}`}>Read Book</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookQuotes.map((quote) => (
                  <Card key={quote.id} className="group flex flex-col h-full bg-card hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-b from-background to-muted/20 rounded-2xl overflow-hidden ring-1 ring-border/50">
                    <div className="p-6 flex-1 flex flex-col space-y-4">
                      <div className="flex items-start justify-between">
                        <QuoteIcon className="h-8 w-8 text-primary/10 -ml-1" />
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-yellow-500/10"
                            onClick={() => toggleFavorite(quote.id, quote.is_favorite)}
                          >
                            <Star
                              className={`h-4 w-4 ${quote.is_favorite
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-muted-foreground'
                                }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this quote?')) deleteQuote(quote.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-[17px] font-serif leading-relaxed italic text-foreground/90 line-clamp-6">
                          "{quote.quote_text}"
                        </p>
                      </div>

                      {quote.note && (
                        <div className="bg-primary/5 p-3 rounded-xl ring-1 ring-primary/10">
                          <p className="text-xs text-muted-foreground leading-snug">
                            <span className="font-bold text-primary/70 uppercase tracking-widest text-[10px] block mb-1">My Note</span>
                            {quote.note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 bg-muted/50 border-t flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <div className="flex gap-3">
                        {quote.page_number && <span>Page {quote.page_number}</span>}
                        {quote.chapter && <span className="truncate max-w-[100px]">{quote.chapter}</span>}
                        {!quote.page_number && quote.progress_percentage && <span>{quote.progress_percentage}%</span>}
                      </div>
                      <Link
                        href={getJumpUrl(quote)}
                        className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                      >
                        Jump <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
