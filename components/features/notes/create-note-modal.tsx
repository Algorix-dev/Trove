"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

export function CreateNoteModal() {
    const [open, setOpen] = useState(false)
    const [bookTitle, setBookTitle] = useState("")
    const [highlight, setHighlight] = useState("")
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSubmit = async () => {
        if (!user || !bookTitle || !note) return

        setLoading(true)
        try {
            // For now, we'll store notes without linking to a specific book
            // In a real app, you'd have a book selector
            const { error } = await supabase
                .from('notes')
                .insert({
                    user_id: user.id,
                    book_id: null, // Would be selected from a dropdown in production
                    content: note,
                    // Store highlight and book title in metadata for now
                })

            if (error) throw error

            setOpen(false)
            setBookTitle("")
            setHighlight("")
            setNote("")
            router.refresh()
            alert("Note created successfully!")
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Create Note
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Note</DialogTitle>
                    <DialogDescription>
                        Add a new note or highlight from your reading.
                    </DialogDescription>
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
                            "Create Note"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
