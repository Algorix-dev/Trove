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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-border/50 p-8">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full opacity-70 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl relative">
                            <AvatarImage src={user.avatar_url} alt={user.full_name} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-background/50 backdrop-blur-xl text-primary font-bold">
                                {user.full_name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 border-none px-2 py-1 shadow-lg">
                                Lvl 1
                            </Badge>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-3 z-10">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {user.full_name || "Reader"}
                            </h1>
                            <p className="text-lg text-muted-foreground font-medium">{user.email}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <Badge variant="secondary" className="px-3 py-1.5 gap-1.5 text-sm font-normal backdrop-blur-sm bg-background/50">
                                <CalendarDays className="h-4 w-4 text-blue-500" />
                                Member since {joinDate}
                            </Badge>
                            <Badge variant="secondary" className="px-3 py-1.5 gap-1.5 text-sm font-normal backdrop-blur-sm bg-background/50">
                                <Award className="h-4 w-4 text-purple-500" />
                                Scholar Rank
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-full">
                            <BookOpen className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                {stats.booksRead}
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Books Read</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20 shadow-lg shadow-orange-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                        <div className="p-3 bg-orange-500/10 rounded-full">
                            <Flame className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                {stats.streak}
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Day Streak</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-yellow-500/20 shadow-lg shadow-yellow-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                        <div className="p-3 bg-yellow-500/10 rounded-full">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                                {stats.highestStreak}
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Best Streak</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20 shadow-lg shadow-purple-500/5 transition-all duration-300 hover:scale-105 hover:bg-card/80">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-full">
                            <Award className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                {Math.floor(stats.totalMinutes / 60)}
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Hours Read</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
