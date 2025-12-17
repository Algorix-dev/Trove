"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, BookOpen, Flame, Award, Trophy } from "lucide-react"
import { format } from "date-fns"

interface ProfileHeaderProps {
    user: {
        full_name?: string
        email?: string
        avatar_url?: string
        created_at?: string
        rank?: number
        rank_title?: string
    }
    stats: {
        booksRead: number
        streak: number
        highestStreak: number
        totalMinutes: number
    }
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
    const joinDate = user.created_at ? format(new Date(user.created_at), "MMMM yyyy") : "Unknown"

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {user.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <div>
                        <h1 className="text-3xl font-bold">{user.full_name || "Reader"}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            Joined {joinDate}
                        </div>
                        {user.rank_title && (
                            <div className="flex items-center gap-1">
                                <Award className="h-4 w-4" />
                                {user.rank_title} {user.rank !== undefined && `(Rank ${user.rank})`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                        <div className="text-2xl font-bold">{stats.booksRead}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Books Read</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                        <Flame className="h-8 w-8 text-orange-500" />
                        <div className="text-2xl font-bold">{stats.streak}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Current Streak</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <div className="text-2xl font-bold">{stats.highestStreak}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Best Streak</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                        <Award className="h-8 w-8 text-purple-500" />
                        <div className="text-2xl font-bold">{Math.floor(stats.totalMinutes / 60)}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Hours Read</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
