"use client"

import { BookmarksList } from "@/components/features/bookmarks/bookmarks-list"
import { useAuth } from "@/components/providers/auth-provider"

export default function BookmarksPage() {
    const { user } = useAuth()

    if (!user) return null

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
