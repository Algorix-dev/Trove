"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { format, subDays } from "date-fns"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AnalyticsCharts({ readingProgress, userId }: { readingProgress?: any[], userId?: string }) {
    const [dailyData, setDailyData] = useState<{ name: string; minutes: number }[]>([])
    const [formatChartData, setFormatChartData] = useState<{ name: string; value: number }[]>([])
    const [trendData, setTrendData] = useState<{ name: string; minutes: number }[]>([])
    const [loading, setLoading] = useState(true)


    const supabase = createBrowserSupabaseClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // If userId provided, get data client-side if needed, otherwise readingProgress (server) will be used
                let uid = userId
                if (!uid) {
                    const { data: { user } } = await supabase.auth.getUser()
                    uid = user?.id
                    if (!uid) {
                        setLoading(false)
                        return
                    }
                }

                // 1. Daily data (server may have passed readingProgress; fallback to client)
                const today = new Date()
                const lastWeek = subDays(today, 6)

                const { data: sessions } = await supabase
                    .from('reading_sessions')
                    .select('duration_minutes, session_date')
                    .eq('user_id', uid)
                    .gte('session_date', format(lastWeek, 'yyyy-MM-dd'))
                    .lte('session_date', format(today, 'yyyy-MM-dd'))

                const chartData = []
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(today, i)
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const dayName = format(date, 'EEE')
                    const minutes = (sessions || []).filter((s: any) => s.session_date === dateStr).reduce((acc: number, s: any) => acc + s.duration_minutes, 0)
                    chartData.push({ name: dayName, minutes })
                }
                setDailyData(chartData)

                // 2. Format data
                const { data: books } = await supabase.from('books').select('format').eq('user_id', uid)
                const formatCounts: Record<string, number> = {};
                (books || []).forEach((book: any) => {
                    const fmt = (book.format || 'pdf').toUpperCase()
                    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1
                })
                const formatChartDataArray = Object.entries(formatCounts).map(([name, value]) => ({ name, value }))
                if (formatChartDataArray.length === 0) formatChartDataArray.push({ name: "No Books", value: 1 })
                setFormatChartData(formatChartDataArray)

                // 3. monthly trend
                const lastMonth = subDays(today, 28)
                const { data: monthSessions } = await supabase.from('reading_sessions').select('duration_minutes, session_date').eq('user_id', uid).gte('session_date', format(lastMonth, 'yyyy-MM-dd'))

                setTrendData([
                    { name: "3 Weeks Ago", minutes: getWeeklyMinutes(monthSessions, 3) },
                    { name: "2 Weeks Ago", minutes: getWeeklyMinutes(monthSessions, 2) },
                    { name: "Last Week", minutes: getWeeklyMinutes(monthSessions, 1) },
                    { name: "This Week", minutes: getWeeklyMinutes(monthSessions, 0) },
                ])

            } catch (err) {
                console.error("Analytics fetch failed", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    function getWeeklyMinutes(sessions: any[] | null, weeksAgo: number) {
        const today = new Date()
        const endDay = subDays(today, weeksAgo * 7)
        const startDay = subDays(endDay, 6)
        const startStr = format(startDay, 'yyyy-MM-dd')
        const endStr = format(endDay, 'yyyy-MM-dd')
        return (sessions || []).filter((s: any) => s.session_date >= startStr && s.session_date <= endStr).reduce((acc: number, s: any) => acc + s.duration_minutes, 0)
    }

    if (loading) {
        return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 animate-pulse">
            <Card className="h-[300px] bg-muted/20" />
            <Card className="h-[300px] bg-muted/20" />
            <Card className="h-[300px] bg-muted/20 col-span-2" />
        </div>
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Daily Reading Time</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Reading Formats</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={formatChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {formatChartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-4">
                        {formatChartData.map((entry, index) => <div key={entry.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{entry.name}</div>)}
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2">
                <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                            <Tooltip />
                            <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
