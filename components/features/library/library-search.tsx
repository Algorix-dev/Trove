'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Book } from '@/types/database';

interface LibrarySearchProps {
  books: Book[];
  onFilteredChange: (filtered: Book[]) => void;
}

type SortOption = 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc' | 'author-asc';
type FormatFilter = 'all' | 'pdf' | 'epub' | 'txt';

export function LibrarySearch({ books, onFilteredChange }: LibrarySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search by title or author
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
      );
    }

    // Filter by format
    if (formatFilter !== 'all') {
      result = result.filter((book) => book.format === formatFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'author-asc':
          return a.author.localeCompare(b.author);
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [books, searchQuery, formatFilter, sortBy]);

  // Notify parent of changes
  useMemo(() => {
    onFilteredChange(filteredBooks);
  }, [filteredBooks, onFilteredChange]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFormatFilter('all');
    setSortBy('date-desc');
  };

  const hasActiveFilters = searchQuery !== '' || formatFilter !== 'all' || sortBy !== 'date-desc';

  return (
    <div className="space-y-6">
      {/* Premium Search Bar Container */}
      <div className="bg-card/30 backdrop-blur-md p-4 rounded-[2rem] border border-border/50 shadow-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Search your treasures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-background/50 border-none rounded-2xl focus-visible:ring-primary/20 text-lg shadow-inner"
            aria-label="Search books by title or author"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-full"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'h-14 px-6 rounded-2xl gap-2 font-semibold transition-all shadow-md items-center justify-center flex',
              showFilters ? 'shadow-primary/30' : 'hover:bg-primary/10'
            )}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Premium Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-card/20 backdrop-blur-xl rounded-[2rem] border border-border/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-2">Format</label>
            <Select
              value={formatFilter}
              onValueChange={(value: FormatFilter) => setFormatFilter(value)}
            >
              <SelectTrigger className="h-12 bg-background/50 border-none rounded-xl focus:ring-primary/20 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="epub">EPUB</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-2">Sort By</label>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="h-12 bg-background/50 border-none rounded-xl focus:ring-primary/20 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                <SelectItem value="author-asc">Author (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-1">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-12 w-full rounded-xl hover:bg-destructive/5 hover:text-destructive gap-2 text-muted-foreground transition-all"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground ml-4 flex items-center gap-2">
        <div className="w-1 h-1 bg-primary rounded-full" />
        {filteredBooks.length === books.length
          ? `Showing all ${books.length} ${books.length === 1 ? 'book' : 'books'}`
          : `Showing ${filteredBooks.length} of ${books.length} ${books.length === 1 ? 'book' : 'books'}`}
      </div>
    </div>
  );
}
