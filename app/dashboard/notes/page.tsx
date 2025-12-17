import { NotesList } from "@/components/features/notes/notes-list"

export default function NotesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Notes & Highlights</h2>
            </div>
            <NotesList />
        </div>
    )
}
