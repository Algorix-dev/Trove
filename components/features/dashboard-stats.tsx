"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Clock, BookOpen, TrendingUp } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import type { ReadingProgress, ReadingSession } from "@/types/database"

export function DashboardStats() {
    const [stats, setStats] = useState({
        streak: 0,
        totalMinutes: 0,
        booksRead: 0,
        dailyGoal: 30,
        todayMinutes: 0,
        readingNow: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createBrowserSupabaseClient()
            try {
                setLoading(true)
                setError(null)

                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError) {
                    console.error('Auth error in dashboard stats:', authError)
                    setError('Authentication error')
                    return
                }

                if (!user) {
                    setError('Not authenticated')
                    return
                }

                // Fetch all data in parallel for better performance
                const [profileData, progressData, sessionsData] = await Promise.all([
                    // Fetch profile for streak and goal
                    supabase
                        .from('profiles')
                        .select('current_streak, daily_goal_minutes')
                        .eq('id', user.id)
                        .maybeSingle(),

                    // Fetch reading progress stats
                    supabase
                        .from('reading_progress')
                        .select('*', { count: 'exact' })
                        .eq('user_id', user.id),

                    // Fetch all reading sessions
                    supabase
                        .from('reading_sessions')
                        .select('*')
                        .eq('user_id', user.id)
                ])

                // Check for errors in parallel requests
                if (profileData.error) console.error('Profile error:', profileData.error)
                if (progressData.error) console.error('Progress error:', progressData.error)
                if (sessionsData.error) console.error('Sessions error:', sessionsData.error)

                // Calculate books read
                const booksRead = progressData.data?.filter((p: ReadingProgress) => p.progress_percentage === 100)


                // Calculate books currently reading
                const readingNow = progressData.data?.filter((p: ReadingProgress) => p.progress_percentage < 100)


                // Calculate total and today's minutes
                const totalMinutes = sessionsData.data?.reduce((acc: number, session: ReadingSession) => {
                    return acc + session.duration_minutes
                }, 0) || 0
                const todayLocal = format(new Date(), 'yyyy-MM-dd')


                const todayMinutes = sessionsData.data
                    ?.filter((session: ReadingSession) => session.session_date === todayLocal)

                    .reduce(
                        (acc: number, session: ReadingSession) =>
                            acc + session.duration_minutes,
                        0
                    ) || 0


                setStats({
                    streak: profileData.data?.current_streak || 0,
                    totalMinutes,
                    booksRead: booksRead?.length || 0,
                    dailyGoal: profileData.data?.daily_goal_minutes || 30,
                    todayMinutes,
                    readingNow: readingNow?.length || 0
                })
            } catch (err) {
                console.error('Unexpected error in dashboard stats:', err)
                setError('Failed to load statistics')
            } finally {
                setLoading(false)
            }
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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20 shadow-lg shadow-orange-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <div className="p-2 bg-orange-500/10 rounded-full">
                        <Flame className="h-4 w-4 text-orange-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {stats.streak} Days
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Keep the flame alive!</p>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Minutes</CardTitle>
                    <div className="p-2 bg-blue-500/10 rounded-full">
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        {stats.todayMinutes}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Minutes read today</p>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-green-500/20 shadow-lg shadow-green-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Books Read</CardTitle>
                    <div className="p-2 bg-green-500/10 rounded-full">
                        <BookOpen className="h-4 w-4 text-green-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                        {stats.booksRead}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total completed books</p>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20 shadow-lg shadow-purple-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
                    <div className="p-2 bg-purple-500/10 rounded-full">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {Math.round((stats.todayMinutes / stats.dailyGoal) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stats.todayMinutes}/{stats.dailyGoal} minutes</p>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-indigo-500/20 shadow-lg shadow-indigo-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reading Now</CardTitle>
                    <div className="p-2 bg-indigo-500/10 rounded-full">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                        {stats.readingNow}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Active books</p>
                </CardContent>
            </Card>
        </div>
    )
}
