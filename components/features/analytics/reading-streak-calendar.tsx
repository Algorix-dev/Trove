"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"

interface ReadingDay {
    date: string
    minutes: number
}

export function ReadingStreakCalendar() {
    const { user } = useAuth()
    const [readingData, setReadingData] = useState<ReadingDay[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        const fetchReadingData = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Get last 365 days of reading sessions
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

            const { data } = await supabase
                .from('reading_sessions')
                .select('session_date, duration_minutes')
                .eq('user_id', user.id)
                .gte('session_date', oneYearAgo.toISOString().split('T')[0])
                .order('session_date', { ascending: true })

            if (data) {
                // Aggregate minutes by date
                const dateMap = new Map<string, number>()
                data.forEach(session => {
                    const existing = dateMap.get(session.session_date) || 0
                    dateMap.set(session.session_date, existing + session.duration_minutes)
                })

                setReadingData(
                    Array.from(dateMap.entries()).map(([date, minutes]) => ({
                        date,
                        minutes
                    }))
                )
            }
            setLoading(false)
        }

        fetchReadingData()
    }, [user])

    // Generate calendar grid
    const generateCalendar = () => {
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 364) // Show 365 days

        const weeks: ReadingDay[][] = []
        let currentWeek: ReadingDay[] = []

        // Start from the first day of the week containing startDate
        const firstDay = new Date(startDate)
        firstDay.setDate(startDate.getDate() - startDate.getDay())

        for (let i = 0; i < 371; i++) { // 53 weeks * 7 days
            const currentDate = new Date(firstDay)
            currentDate.setDate(firstDay.getDate() + i)

            const dateStr = currentDate.toISOString().split('T')[0]
            const dayData = readingData.find(d => d.date === dateStr)

            currentWeek.push({
                date: dateStr,
                minutes: dayData?.minutes || 0
            })

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
            }
        }

        return weeks
    }

    const getIntensityColor = (minutes: number): string => {
        if (minutes === 0) return 'bg-muted'
        if (minutes < 15) return 'bg-emerald-200 dark:bg-emerald-900/40'
        if (minutes < 30) return 'bg-emerald-400 dark:bg-emerald-700/60'
        if (minutes < 60) return 'bg-emerald-600 dark:bg-emerald-500/80'
        return 'bg-emerald-700 dark:bg-emerald-400'
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const weeks = generateCalendar()
    const totalDays = readingData.length
    const currentStreak = calculateCurrentStreak()
    const longestStreak = calculateLongestStreak()

    function calculateCurrentStreak(): number {
        if (readingData.length === 0) return 0

        let streak = 0
        const today = new Date()
        const currentDate = new Date(today)

        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0]
            const hasReading = readingData.some(d => d.date === dateStr && d.minutes > 0)

            if (!hasReading) break

            streak++
            currentDate.setDate(currentDate.getDate() - 1)
        }

        return streak
    }

    function calculateLongestStreak(): number {
        if (readingData.length === 0) return 0

        const sortedData = [...readingData].sort((a, b) => a.date.localeCompare(b.date))
        let maxStreak = 0
        let currentStreak = 0
        let lastDate: Date | null = null

        sortedData.forEach(day => {
            if (day.minutes === 0) {
                currentStreak = 0
                lastDate = null
                return
            }

            const currentDate = new Date(day.date)

            if (lastDate) {
                const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
                if (dayDiff === 1) {
                    currentStreak++
                } else {
                    currentStreak = 1
                }
            } else {
                currentStreak = 1
            }

            maxStreak = Math.max(maxStreak, currentStreak)
            lastDate = currentDate
        })

        return maxStreak
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        Reading Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-32 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Reading Activity
                </CardTitle>
                <div className="flex gap-6 text-sm text-muted-foreground mt-2">
                    <div>
                        <span className="font-semibold text-foreground">{totalDays}</span> days active
                    </div>
                    <div>
                        <span className="font-semibold text-foreground">{currentStreak}</span> day current streak
                    </div>
                    <div>
                        <span className="font-semibold text-foreground">{longestStreak}</span> day longest streak
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-4">
                    <div className="inline-flex gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={day.date}
                                        className={`w-3 h-3 rounded-sm ${getIntensityColor(day.minutes)} hover:ring-2 hover:ring-primary transition-all cursor-pointer group relative`}
                                        title={`${formatDate(day.date)}: ${day.minutes} minutes`}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            {formatDate(day.date)}: {day.minutes} min
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/60" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500/80" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-700 dark:bg-emerald-400" />
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    )
}
