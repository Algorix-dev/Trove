import { DashboardStats } from "@/components/features/dashboard-stats"
import { DashboardCharts } from "@/components/features/dashboard-charts"
import { ContinueReading } from "@/components/features/continue-reading"
import { QuickActions } from "@/components/features/quick-actions"
import { ShareInviteModal } from "@/components/features/share-invite-modal"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const name = profile?.full_name || user.user_metadata?.full_name || "Reader"
    const hour = new Date().getHours()
    let greeting = "Good Morning"
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon"
    if (hour >= 17) greeting = "Good Evening"

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{greeting}, {name}</h2>
                    <p className="text-muted-foreground">Ready to continue your reading journey?</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground italic bg-muted/50 px-4 py-2 rounded-full hidden md:block">
                        "A reader lives a thousand lives before he dies." — George R.R. Martin
                    </div>
                    <ShareInviteModal />
                </div>
            </div>

            <DashboardStats />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-6">
                    <ContinueReading />
                    <QuickActions />
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <DashboardCharts />
                </div>
            </div>
        </div>
    )
}
