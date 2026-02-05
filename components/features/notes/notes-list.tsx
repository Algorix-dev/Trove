'use client';

import { createBrowserClient } from '@supabase/ssr';
import { BookOpen, Eye, Quote, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/components/features/delete-confirm-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Note } from '@/types/database';

import { CreateNoteModal } from './create-note-modal';

export function NotesList() {
  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;

    // Fetch regular notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*, books(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch highlights (book_quotes)
    const { data: quotesData } = await supabase
      .from('book_quotes')
      .select('*, books(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const combined: any[] = [
      ...(notesData || []).map(n => ({ ...n, type: 'note' })),
      ...(quotesData || []).map(q => ({ ...q, type: 'highlight' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotes(combined);
    setLoading(false);
  };

  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const handleDeleteClick = (noteId: string) => {
    const dontAsk = localStorage.getItem('trove-delete-note-dont-ask');
    if (dontAsk === 'true') {
      performDelete(noteId);
    } else {
      setDeleteNoteId(noteId);
    }
  };

  const performDelete = async (noteId: string) => {
    try {
      const { error, count } = await supabase
        .from('notes')
        .delete({ count: 'exact' })
        .eq('id', noteId);

      if (error) throw error;
      if (count === 0) throw new Error('Could not delete note. You might not have permission.');

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete note');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading notes...</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search notes..." className="pl-8" />
          </div>
          <CreateNoteModal />
        </div>
        <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-lg">No notes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first note to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search notes..." className="pl-8" />
        </div>
        <CreateNoteModal />
      </div>

      <div className="grid gap-4">
        {notes.map((note: any) => (
          <Card key={note.id} className="group relative hover:border-primary/50 transition-colors overflow-hidden">
            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {note.book_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (note.page_number) params.append('page', note.page_number.toString());
                    const cfi = (note.selection_data as any)?.cfi;
                    if (cfi) params.append('cfi', cfi);
                    window.location.href = `/dashboard/reader/${note.book_id}${params.toString() ? '?' + params.toString() : ''}`;
                  }}
                  title="View in Reader"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteClick(note.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    {note.type === 'highlight' ? <Quote className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                    {note.type === 'highlight' ? 'Highlight' : 'Note'}
                  </div>
                  {note.books?.title && (
                    <div className="text-sm font-semibold truncate max-w-[300px]">
                      {note.books.title}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {note.type === 'highlight' && (
                <div
                  className="pl-3 border-l-4 italic text-muted-foreground mb-2 py-1"
                  style={{ borderColor: note.color || '#fef08a' }}
                >
                  &quot;{note.quote_text}&quot;
                </div>
              )}
              <p className="text-sm">{note.type === 'highlight' ? note.note : note.content}</p>
              {note.page_number && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Page {note.page_number}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {deleteNoteId && (
        <DeleteConfirmDialog
          open={!!deleteNoteId}
          onOpenChange={(open: boolean) => !open && setDeleteNoteId(null)}
          onConfirm={() => deleteNoteId && performDelete(deleteNoteId)}
          title="Delete Note?"
          description="Are you sure you want to delete this note? This action cannot be undone."
          storageKey="trove-delete-note-dont-ask"
        />
      )}
    </div>
  );
}
