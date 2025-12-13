"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import type { ReadingSession } from "@/types/database"

export function DashboardCharts() {
    const [data, setData] = useState<{ name: string; minutes: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createBrowserSupabaseClient()

            try {
                setLoading(true)
                setError(null)

                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError) {
                    console.error('Auth error in dashboard charts:', authError)
                    setError('Authentication error')
                    return
                }

                if (!user) {
                    setError('Not authenticated')
                    return
                }

                // Get last 7 days range
                const today = new Date()
                const lastWeek = subDays(today, 6) // Last 7 days including today

                const { data: sessions, error: sessionsError } = await supabase
                    .from('reading_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('session_date', format(lastWeek, 'yyyy-MM-dd'))
                    .lte('session_date', format(today, 'yyyy-MM-dd'))

                if (sessionsError) {
                    console.error('Error fetching sessions:', sessionsError)
                    setError('Failed to load reading data')
                    return
                }

                // Initialize chart data with 0s for last 7 days
                const chartData = []
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(today, i)
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const dayName = format(date, 'EEE') // Mon, Tue, etc.

                    // Sum minutes for this day
                    const minutes = (sessions as ReadingSession[])
                        ?.filter((s: ReadingSession) => s.session_date === dateStr)
                        .reduce((acc, s) => acc + s.duration_minutes, 0) || 0


                    chartData.push({
                        name: dayName,
                        minutes: minutes
                    })
                }

                setData(chartData)
            } catch (err) {
                console.error('Unexpected error in dashboard charts:', err)
                setError('An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium">{payload[0].payload.name}</p>
                    <p className="text-sm text-primary font-bold">{payload[0].value} minutes</p>
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <Card className="col-span-4 h-[430px] animate-pulse">
                <CardHeader>
                    <div className="h-6 w-48 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] bg-muted/20 rounded"></div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-4 w-full">
            <CardHeader>
                <CardTitle>Weekly Reading Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350} minHeight={300}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}m`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
