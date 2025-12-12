import { DashboardStats } from "@/components/features/dashboard-stats"
import { DashboardCharts } from "@/components/features/dashboard-charts"
import { ContinueReading } from "@/components/features/continue-reading"
import { QuickActions } from "@/components/features/quick-actions"
import { ShareInviteModal } from "@/components/features/share-invite-modal"
import { LevelProgress } from "@/components/features/gamification/level-progress"
import { AchievementConfetti } from "@/components/features/gamification/achievement-confetti"
import { DailyGoalCelebration } from "@/components/features/gamification/daily-goal-celebration"
import { LevelUpCelebration } from "@/components/features/gamification/level-up-celebration"
import { ReadingStreakCalendar } from "@/components/features/analytics/reading-streak-calendar"
import { ReadingGoals } from "@/components/features/analytics/reading-goals"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, total_xp, current_level')
        .eq('id', user.id)
        .single()

    // Fetch levels for progress calculation
    const { data: levels } = await supabase
        .from('levels')
        .select('*')
        .order('min_xp', { ascending: true })

    const currentLevel = profile?.current_level || 1
    const currentXP = profile?.total_xp || 0

    const levelInfo = levels?.find(l => l.level === currentLevel)
    const nextLevelInfo = levels?.find(l => l.level === currentLevel + 1)

    const nextLevelXP = nextLevelInfo?.min_xp || (levelInfo?.min_xp || 0) + 1000 // Fallback if max level
    const levelTitle = levelInfo?.title || "Reader"

    // Use username if available, otherwise full name, otherwise "Reader"
    const name = profile?.username || profile?.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || "Reader"
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

            <div className="grid gap-6 md:grid-cols-2">
                <LevelProgress
                    level={currentLevel}
                    currentXP={currentXP}
                    nextLevelXP={nextLevelXP}
                    levelTitle={levelTitle}
                />
                <ReadingGoals />
            </div>

            <ReadingStreakCalendar />

            <AchievementConfetti />
            <DailyGoalCelebration />
            <LevelUpCelebration />

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
