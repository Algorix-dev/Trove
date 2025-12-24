"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, BookOpen } from "lucide-react"
import { CreateNoteModal } from "./create-note-modal"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useEffect, useState } from "react"


import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "@/components/features/delete-confirm-dialog"

import type { Note } from "@/types/database"

export function NotesList() {
    const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )

    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return
        fetchNotes()
    }, [user])

    const fetchNotes = async () => {
        if (!user) return
        const { data } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setNotes(data)
        }
        setLoading(false)
    }

    const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)

    const handleDeleteClick = (noteId: string) => {
        const dontAsk = localStorage.getItem("trove-delete-note-dont-ask")
        if (dontAsk === "true") {
            performDelete(noteId)
        } else {
            setDeleteNoteId(noteId)
        }
    }

    const performDelete = async (noteId: string) => {
        try {
            const { error, count } = await supabase
                .from('notes')
                .delete({ count: 'exact' })
                .eq('id', noteId)

            if (error) throw error
            if (count === 0) throw new Error("Could not delete note. You might not have permission.")

            setNotes(prev => prev.filter(n => n.id !== noteId))
            toast.success("Note deleted")
        } catch (error) {
            console.error('Delete error:', error)
            toast.error("Failed to delete note")
        }
    }

    if (loading) {
        return <div className="text-center py-10">Loading notes...</div>
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
                    <p className="text-sm text-muted-foreground mb-4">Create your first note to get started!</p>
                </div>
            </div>
        )
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
                {notes.map((note) => (
                    <Card key={note.id} className="group relative hover:border-primary/50 transition-colors">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteClick(note.id)}
                        >
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BookOpen className="h-4 w-4" />
                                    {note.book_id ? "Book Note" : "General Note"}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(note.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm">{note.content}</p>
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
    )
}
