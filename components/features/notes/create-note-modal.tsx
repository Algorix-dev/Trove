'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Book } from '@/types/database';

export function CreateNoteModal() {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchBooks();
    }
  };
  const [bookTitle, setBookTitle] = useState('');
  const [highlight, setHighlight] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const [libraryBooks, setLibraryBooks] = useState<Pick<Book, 'id' | 'title'>[]>([]);

  // Fetch library books for matching
  const fetchBooks = async () => {
    if (!user) return;
    const { data } = await supabase.from('books').select('id, title').eq('user_id', user.id);

    if (data) setLibraryBooks(data);
  };

  const handleSubmit = async () => {
    if (!user || !bookTitle || !note) return;

    setLoading(true);
    try {
      // Find book with flexible matching (ignore case and extra spaces)
      const targetTitle = bookTitle.trim().toLowerCase().replace(/\s+/g, ' ');

      const matchedBook = libraryBooks.find(
        (b) => b.title.toLowerCase().trim().replace(/\s+/g, ' ') === targetTitle
      );

      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        book_id: matchedBook ? matchedBook.id : null,
        content: note,
        highlight_text: highlight || null,
      });

      if (error) throw error;

      setOpen(false);
      setBookTitle('');
      setHighlight('');
      setNote('');
      router.refresh();
      toast.success(
        matchedBook
          ? 'Note added to ' + matchedBook.title
          : 'General note created (Book not found in library)'
      );
    } catch (error) {
      console.error('Note creation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>Add a new note or highlight from your reading.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="book">Book Title</Label>
            <Input
              id="book"
              placeholder="Enter book title..."
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highlight">Highlight (Optional)</Label>
            <Textarea
              id="highlight"
              placeholder="Paste the text you want to highlight..."
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Your Note</Label>
            <Textarea
              id="note"
              placeholder="Write your thoughts..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!bookTitle || !note || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Note'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
