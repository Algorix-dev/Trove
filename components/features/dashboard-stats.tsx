import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Clock, BookOpen, TrendingUp } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

export function DashboardStats() {
    const [stats, setStats] = useState({
        streak: 0,
        totalMinutes: 0,
        booksRead: 0,
        dailyGoal: 30,
        todayMinutes: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch profile for streak and goal
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak, daily_goal_minutes')
                .eq('id', user.id)
                .single()

            // Fetch books read count
            const { count: booksRead } = await supabase
                .from('reading_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('progress_percentage', 100)

            // Fetch total reading time
            const { data: sessions } = await supabase
                .from('reading_sessions')
                .select('duration_minutes, session_date')
                .eq('user_id', user.id)

            const totalMinutes = sessions?.reduce((acc, session) => acc + session.duration_minutes, 0) || 0

            // Calculate today's minutes
            const today = new Date().toISOString().split('T')[0]
            const todayMinutes = sessions
                ?.filter(session => session.session_date === today)
                .reduce((acc, session) => acc + session.duration_minutes, 0) || 0

            setStats({
                streak: profile?.current_streak || 0,
                totalMinutes,
                booksRead: booksRead || 0,
                dailyGoal: profile?.daily_goal_minutes || 30,
                todayMinutes
            })
            setLoading(false)
        }

        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded"></div>
                            <div className="h-4 w-4 bg-muted rounded"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                            <div className="h-3 w-32 bg-muted rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.streak} Days</div>
                    <p className="text-xs text-muted-foreground">Keep it up!</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMinutes}</div>
                    <p className="text-xs text-muted-foreground">Lifetime reading time</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Books Read</CardTitle>
                    <BookOpen className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.booksRead}</div>
                    <p className="text-xs text-muted-foreground">Completed books</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.todayMinutes}/{stats.dailyGoal}</div>
                    <p className="text-xs text-muted-foreground">Minutes today</p>
                </CardContent>
            </Card>
        </div>
    )
}
