// app/dashboard/analytics/page.tsx
import { AnalyticsCharts } from "@/components/features/analytics/analytics-charts"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
    const supabase = createServerSupabaseClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) return null

    // Example: fetch basic analytics data for the user (adjust as needed)
    const { data: readingProgress } = await supabase
        .from("reading_progress")
        .select("book_id, progress_percentage, updated_at, books(id, title)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(200)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            </div>

            <AnalyticsCharts userId={userId} readingProgress={readingProgress ?? []} />
        </div>
    )
}
