'use client';

import { useState } from 'react';

import type { BookWithProgress } from '@/types/database';

import { BookGrid } from './book-grid';
import { EmptyLibrary } from './empty-library';
import { LibrarySearch } from './library-search';

interface LibraryContentProps {
  books: BookWithProgress[];
}

export function LibraryContent({ books }: LibraryContentProps) {
  const [filteredBooks, setFilteredBooks] = useState<BookWithProgress[]>(books);

  if (books.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <div className="space-y-6">
      <LibrarySearch
        books={books}
        onFilteredChange={(filtered) => setFilteredBooks(filtered as BookWithProgress[])}
      />
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-lg text-muted-foreground mb-2">No books match your search</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <BookGrid books={filteredBooks} />
      )}
    </div>
  );
}
