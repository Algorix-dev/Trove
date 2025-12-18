import { NotesList } from "@/components/features/notes/notes-list"

export default function NotesPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">Notes & Highlights</h2>
                    <p className="text-muted-foreground text-lg">Your collected thoughts and essential excerpts.</p>
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[3rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <NotesList />
            </div>
        </div>
    )
}
