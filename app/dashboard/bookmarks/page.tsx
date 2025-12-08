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
        <div className="container max-w-6xl mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Bookmarks</h1>
                <p className="text-muted-foreground">
                    Quick access to your saved reading positions
                </p>
            </div>

            <BookmarksList userId={user.id} />
        </div>
    )
}
