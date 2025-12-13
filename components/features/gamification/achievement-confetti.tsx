"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Trophy } from "lucide-react"
import Link from "next/link"
import type { UserAchievement } from "@/types/database"

interface AchievementConfettiProps {
    duration?: number
}

export function AchievementConfetti({ duration = 5000 }: AchievementConfettiProps) {
    const { width, height } = useWindowSize()
    const [show, setShow] = useState(false)
    const [achievements, setAchievements] = useState<string[]>([])

    // Check for unnotified achievements
    useEffect(() => {
        const checkAchievements = async () => {
            const supabase = createBrowserSupabaseClient()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get session storage key for this user
            const sessionKey = `confetti_shown_${user.id}`
            const shownAchievements = JSON.parse(sessionStorage.getItem(sessionKey) || '[]')

            // 1. Get unnotified achievements
            const { data: newAchievements } = await supabase
                .from('user_achievements')
                .select('id, user_id, achievement_id, unlocked_at, notified, achievements(name, description)')
                .eq('user_id', user.id)
                .eq('notified', false)

            if (newAchievements && newAchievements.length > 0) {
                // Filter out achievements that have already been shown in this session
                const achievementsToShow = newAchievements.filter(
                    (ua: UserAchievement) => !shownAchievements.includes(ua.id)
                )


                if (achievementsToShow.length > 0) {
                    setShow(true)
                    const names = achievementsToShow.map((ua: UserAchievement) => ua.achievements?.name || "New Achievement")
                    setAchievements(names)

                    // Show toast notification for each achievement
                    achievementsToShow.forEach((ua: UserAchievement) => {
                        toast.success(
                            <div className="flex items-start gap-3">
                                <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-semibold">Achievement Unlocked!</div>
                                    <div className="text-sm opacity-90">{ua.achievements?.name || "New Achievement"}</div>
                                </div>
                            </div>,
                            {
                                duration: 6000,
                                action: {
                                    label: "View Profile",
                                    onClick: () => window.location.href = '/dashboard/profile'
                                }
                            }
                        )
                    })

                    // 2. Mark as notified in database
                    const ids = achievementsToShow.map((ua: UserAchievement) => ua.id)
                    await supabase
                        .from('user_achievements')
                        .update({ notified: true })
                        .in('id', ids)

                    // 3. Store in session storage to prevent re-showing
                    const updatedShown = [...shownAchievements, ...ids]
                    sessionStorage.setItem(sessionKey, JSON.stringify(updatedShown))
                }
            }
        }

        checkAchievements()
        // Check every 30 seconds for new achievements
        const interval = setInterval(checkAchievements, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => setShow(false), duration)
            return () => clearTimeout(timer)
        }
    }, [show, duration])

    if (!show) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <Confetti
                width={width}
                height={height}
                numberOfPieces={200}
                recycle={false}
                gravity={0.2}
            />
        </div>
    )
}
