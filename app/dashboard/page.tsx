import { DashboardStats } from "@/components/features/dashboard-stats"
import { ContinueReading } from "@/components/features/continue-reading"
import { QuickActions } from "@/components/features/quick-actions"
import { ShareInviteModal } from "@/components/features/share-invite-modal"
import { LevelProgress } from "@/components/features/gamification/level-progress"
import { ReadingGoals } from "@/components/features/analytics/reading-goals"
import { DashboardQuote } from "@/components/features/dashboard-quote"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"

// Lazy load heavy components for better performance
const DashboardCharts = dynamic(() => import("@/components/features/dashboard-charts").then(mod => ({ default: mod.DashboardCharts })), {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
    ssr: false
})

const AchievementConfetti = dynamic(() => import("@/components/features/gamification/achievement-confetti").then(mod => ({ default: mod.AchievementConfetti })), {
    ssr: false
})

const DailyGoalCelebration = dynamic(() => import("@/components/features/gamification/daily-goal-celebration").then(mod => ({ default: mod.DailyGoalCelebration })), {
    ssr: false
})

const LevelUpCelebration = dynamic(() => import("@/components/features/gamification/level-up-celebration").then(mod => ({ default: mod.LevelUpCelebration })), {
    ssr: false
})

const ReadingStreakCalendar = dynamic(() => import("@/components/features/analytics/reading-streak-calendar").then(mod => ({ default: mod.ReadingStreakCalendar })), {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
    ssr: false
})

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, nickname, onboarding_completed, tutorial_completed, total_xp, current_level')
        .eq('id', user.id)
        .single()

    // Redirect to onboarding if not completed
    if (!profile?.onboarding_completed) {
        redirect("/onboarding")
    }

    // Redirect to tutorial if onboarding done but tutorial not completed
    if (profile?.onboarding_completed && !profile?.tutorial_completed) {
        redirect("/dashboard/tutorial")
    }

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

    // Use nickname if available, then username, then full name, otherwise "Reader"
    const name = profile?.nickname || profile?.username || profile?.['full_name']?.split(' ')[0] || user?.['user_metadata']?.['full_name']?.split(' ')[0] || "Reader"
    const hour = new Date().getHours()
    let greeting = "Good Morning"
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon"
    if (hour >= 17) greeting = "Good Evening"

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                        {greeting}, {name}
                    </h2>
                    <p className="text-muted-foreground text-lg">Your reading journey continues here.</p>
                </div>
                <div className="flex items-center gap-4">
                    <DashboardQuote />
                    <ShareInviteModal />
                </div>
            </div>

            <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 shadow-2xl">
                <div className="bg-card/40 backdrop-blur-2xl p-6 rounded-[2.4rem] border border-white/10">
                    <DashboardStats />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="bg-card/40 backdrop-blur-xl p-6 rounded-[2rem] border border-border/50 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <LevelProgress
                        level={currentLevel}
                        currentXP={currentXP}
                        nextLevelXP={nextLevelXP}
                        levelTitle={levelTitle}
                    />
                </div>
                <div className="bg-card/40 backdrop-blur-xl p-6 rounded-[2rem] border border-border/50 shadow-xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ReadingGoals />
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-xl">
                <ReadingStreakCalendar />
            </div>

            <AchievementConfetti />
            <DailyGoalCelebration />
            <LevelUpCelebration />

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-8">
                    <div className="bg-card/30 backdrop-blur-md p-6 rounded-[2rem] border border-border/50 shadow-lg">
                        <ContinueReading />
                    </div>
                    <div className="bg-card/30 backdrop-blur-md p-6 rounded-[2rem] border border-border/50 shadow-lg">
                        <QuickActions />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-xl">
                    <DashboardCharts />
                </div>
            </div>
        </div>
    )
}
