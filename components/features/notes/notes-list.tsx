"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, BookOpen } from "lucide-react"
import { CreateNoteModal } from "./create-note-modal"

const notes = [
    {
        id: 1,
        book: "The Great Gatsby",
        highlight: "So we beat on, boats against the current, borne back ceaselessly into the past.",
        note: "This is the most famous line. Represents the struggle against time.",
        color: "bg-yellow-200 dark:bg-yellow-900",
        date: "2 days ago"
    },
    {
        id: 2,
        book: "1984",
        highlight: "War is peace. Freedom is slavery. Ignorance is strength.",
        note: "The three slogans of the Party.",
        color: "bg-red-200 dark:bg-red-900",
        date: "1 week ago"
    },
    {
        id: 3,
        book: "Pride and Prejudice",
        highlight: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        note: "Classic opening line. Sets the tone for the entire novel.",
        color: "bg-blue-200 dark:bg-blue-900",
        date: "3 weeks ago"
    }
]

export function NotesList() {
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
                                    {note.book}
                                </div>
                                <span className="text-xs text-muted-foreground">{note.date}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className={`p-3 rounded-md text-sm italic ${note.color} text-foreground/80 border-l-4 border-primary/50`}>
                                "{note.highlight}"
                            </div>
                            <p className="text-sm">{note.note}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
