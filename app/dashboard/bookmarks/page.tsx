import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookmarksList } from "@/components/features/bookmarks/bookmarks-list"

export default async function BookmarksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">Bookmarks</h2>
                    <p className="text-muted-foreground text-lg">Quick access to your saved treasures and notes.</p>
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[3rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <BookmarksList userId={user.id} />
            </div>
        </div>
    )
}
