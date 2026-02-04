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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Book } from '@/types/database';

export function CreateNoteModal() {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchBooks();
    }
  };
  const [selectedBookId, setSelectedBookId] = useState<string>('general');
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

  // Fetch library books for selection
  const fetchBooks = async () => {
    if (!user) return;
    const { data } = await supabase.from('books').select('id, title').eq('user_id', user.id);
    if (data) setLibraryBooks(data);
  };

  const handleSubmit = async () => {
    if (!user || !note) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        book_id: selectedBookId === 'general' ? null : selectedBookId,
        content: note,
        highlight_text: highlight || null,
      });

      if (error) throw error;

      setOpen(false);
      setSelectedBookId('general');
      setHighlight('');
      setNote('');
      router.refresh();
      toast.success(
        selectedBookId !== 'general'
          ? 'Note added to book'
          : 'General note created'
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
            <Label htmlFor="book">Select Book</Label>
            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a book..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Note (No Book)</SelectItem>
                {libraryBooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={!note || loading}>
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
