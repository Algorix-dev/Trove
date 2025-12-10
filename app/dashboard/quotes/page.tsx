import { QuotesList } from "@/components/features/quotes/quotes-list"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function QuotesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // User is guaranteed to exist due to AuthGuard in layout
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
