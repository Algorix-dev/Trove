"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, BookOpen } from "lucide-react"
import { CreateNoteModal } from "./create-note-modal"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useEffect, useState } from "react"


export function NotesList() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Client-side fetching for search interaction would be better, 
    // but for now let's make it a client component that fetches data
    // We need to change the function to be a client component properly or use hooks.
    // Given the "use client" at top, it IS a client component.

    const [notes, setNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return

        const fetchNotes = async () => {
            const { data } = await supabase
                .from('notes')
                .select('*')
                .select('*')
                // Rely on RLS for user filtering
                .order('created_at', { ascending: false })

            if (data) {
                // Transform data if necessary, or just use as is
                // We might need to map book_id to title if we had that relation set up properly
                // For now, let's assume valid data
                setNotes(data)
            }
            setLoading(false)
        }

        fetchNotes()
    }, [user])

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
                    <Card key={note.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BookOpen className="h-4 w-4" />
                                    {/* For now, just show 'General Note' or try to fetch book title if linked */}
                                    {note.book_id ? "Book Note" : "General Note"}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(note.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* If we had highlighting logic, we'd show it here. 
                                For now, just showing content. 
                                The 'create' modal has 'highlight' field but current implementation 
                                of 'create' modal puts 'content' as note. 
                                We probably need to verify schema for notes. 
                            */}
                            <p className="text-sm">{note.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
