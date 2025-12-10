"use client"

import { QuotesList } from "@/components/features/quotes/quotes-list"
import { useAuth } from "@/components/providers/auth-provider"

export default function QuotesPage() {
    const { user } = useAuth()

    if (!user) return null

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Saved Quotes</h2>
                <p className="text-muted-foreground">
                    Your collection of memorable passages and insights
                </p>
            </div>

            <QuotesList userId={user.id} />
        </div>
    )
}
