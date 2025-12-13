"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"

interface Note {
    id: string
    book_id: string
    user_id: string
    content: string
    page_number: number | null
    created_at: string
}

interface NotesListProps {
    bookId: string
}

export function NotesList({ bookId }: NotesListProps) {
    const { user } = useAuth()
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [newNote, setNewNote] = useState("")
    const [newPage, setNewPage] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const supabase = createBrowserSupabaseClient()

    useEffect(() => {
        if (user && bookId) {
            fetchNotes()
        }
    }, [user, bookId])

    const fetchNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('book_id', bookId)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setNotes(data || [])
        } catch (error) {
            console.error('Error fetching notes:', error)
        } finally {
            setLoading(false)
        }
    }

    const addNote = async () => {
        if (!newNote.trim() || !user) return

        try {
            const { data, error } = await supabase
                .from('notes')
                .insert({
                    book_id: bookId,
                    user_id: user.id,
                    content: newNote,
                    page_number: newPage ? parseInt(newPage) : null
                })
                .select()
                .single()

            if (error) throw error
            setNotes([data, ...notes])
            setNewNote("")
            setNewPage("")
            toast.success("Note added!")
        } catch (error) {
            toast.error("Failed to add note")
            console.error(error)
        }
    }

    const updateNote = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notes')
                .update({ content: editContent })
                .eq('id', id)

            if (error) throw error
            setNotes(notes.map(n => n.id === id ? { ...n, content: editContent } : n))
            setEditingId(null)
            toast.success("Note updated!")
        } catch (error) {
            toast.error("Failed to update note")
        }
    }

    const deleteNote = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id)

            if (error) throw error
            setNotes(notes.filter(n => n.id !== id))
            toast.success("Note deleted!")
        } catch (error) {
            toast.error("Failed to delete note")
        }
    }

    if (loading) return <div className="text-center py-4">Loading notes...</div>

    return (
        <div className="space-y-4">
            {/* Add Note */}
            <Card className="p-4">
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Page number (optional)"
                            value={newPage}
                            onChange={(e) => setNewPage(e.target.value)}
                            className="w-32"
                            type="number"
                        />
                    </div>
                    <Textarea
                        placeholder="Write your note here..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <Button onClick={addNote} disabled={!newNote.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                    </Button>
                </div>
            </Card>

            {/* Notes List */}
            {notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notes yet. Add your first note above!</p>
            ) : (
                notes.map((note) => (
                    <Card key={note.id} className="p-4">
                        {editingId === note.id ? (
                            <div className="space-y-3">
                                <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[100px]"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => updateNote(note.id)}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {note.page_number && (
                                    <p className="text-xs text-muted-foreground mb-2">Page {note.page_number}</p>
                                )}
                                <p className="whitespace-pre-wrap mb-3">{note.content}</p>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setEditingId(note.id)
                                            setEditContent(note.content)
                                        }}
                                    >
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteNote(note.id)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                ))
            )}
        </div>
    )
}
