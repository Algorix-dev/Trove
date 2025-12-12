"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Quote, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SaveQuoteButtonProps {
    bookId: string
    bookTitle: string
    selectedText?: string
}

export function SaveQuoteButton({ bookId, bookTitle, selectedText }: SaveQuoteButtonProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [quoteText, setQuoteText] = useState(selectedText || "")
    const [pageNumber, setPageNumber] = useState("")
    const [chapter, setChapter] = useState("")
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)

    const handleSave = async () => {
        if (!user || !quoteText.trim()) return

        setLoading(true)
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { error } = await supabase
                .from('book_quotes')
                .insert({
                    user_id: user.id,
                    book_id: bookId,
                    quote_text: quoteText.trim(),
                    page_number: pageNumber ? parseInt(pageNumber) : null,
                    chapter: chapter || null,
                    note: note || null,
                    is_favorite: isFavorite
                })

            if (error) throw error

            toast.success("Quote saved!")
            setOpen(false)
            resetForm()
            router.refresh()
        } catch (error) {
            console.error('Save quote error:', error)
            toast.error("Failed to save quote")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setQuoteText("")
        setPageNumber("")
        setChapter("")
        setNote("")
        setIsFavorite(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Quote className="h-4 w-4" />
                    Save Quote
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Save Quote from {bookTitle}</DialogTitle>
                    <DialogDescription>
                        Save this quote to your personal collection with optional notes.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Quote</label>
                        <Textarea
                            placeholder="Paste or type the quote..."
                            value={quoteText}
                            onChange={(e) => setQuoteText(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Page Number (optional)</label>
                            <Input
                                type="number"
                                placeholder="e.g., 42"
                                value={pageNumber}
                                onChange={(e) => setPageNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Chapter (optional)</label>
                            <Input
                                placeholder="e.g., Chapter 5"
                                value={chapter}
                                onChange={(e) => setChapter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Personal Note (optional)</label>
                        <Textarea
                            placeholder="Why does this quote resonate with you?"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="favorite"
                            checked={isFavorite}
                            onChange={(e) => setIsFavorite(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="favorite" className="text-sm cursor-pointer">
                            Mark as favorite
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!quoteText.trim() || loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Quote"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
