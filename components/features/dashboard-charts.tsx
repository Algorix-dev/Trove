"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { createBrowserClient } from "@supabase/ssr"
import { format, subDays } from "date-fns"

export function DashboardCharts() {
    const [data, setData] = useState<{ name: string; minutes: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createBrowserClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get last 7 days range
            const today = new Date()
            const lastWeek = subDays(today, 6) // Last 7 days including today

            const { data: sessions } = await supabase
                .from('reading_sessions')
                .select('duration_minutes, session_date')
                .eq('user_id', user.id)
                .gte('session_date', format(lastWeek, 'yyyy-MM-dd'))
                .lte('session_date', format(today, 'yyyy-MM-dd'))

            // Initialize chart data with 0s for last 7 days
            const chartData = []
            for (let i = 6; i >= 0; i--) {
                const date = subDays(today, i)
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayName = format(date, 'EEE') // Mon, Tue, etc.

                // Sum minutes for this day
                const minutes = sessions
                    ?.filter(s => s.session_date === dateStr)
                    .reduce((acc, s) => acc + s.duration_minutes, 0) || 0

                chartData.push({
                    name: dayName,
                    minutes: minutes
                })
            }

            setData(chartData)
            setLoading(false)
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
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                            animationDuration={200}
                        />
                        <Bar
                            dataKey="minutes"
                            fill="hsl(var(--primary))"
                            radius={[8, 8, 0, 0]}
                            className="transition-all duration-300 hover:opacity-80"
                            animationDuration={800}
                            animationEasing="ease-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
