"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
import { Trophy } from "lucide-react"

interface AchievementConfettiProps {
    duration?: number
}

export function AchievementConfetti({ duration = 5000 }: AchievementConfettiProps) {
    const { width, height } = useWindowSize()
    const [show, setShow] = useState(false)

    // Check for unnotified achievements
    useEffect(() => {
        const checkAchievements = async () => {
            const supabase = createBrowserClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get session storage key for this user
            const sessionKey = `confetti_shown_${user.id}`
            const shownAchievements = JSON.parse(sessionStorage.getItem(sessionKey) || '[]')

            // 1. Get unnotified achievements
            const { data: newAchievements } = await supabase
                .from('user_achievements')
                .select('id, achievement_id, achievements(name, description)')
                .eq('user_id', user.id)
                .eq('notified', false)

            if (newAchievements && newAchievements.length > 0) {
                // Filter out achievements that have already been shown in this session
                const achievementsToShow = newAchievements.filter(
                    ua => !shownAchievements.includes(ua.id)
                )

                if (achievementsToShow.length > 0) {
                    setShow(true)

                    // Show toast notification for each achievement
                    achievementsToShow.forEach((ua: any) => {
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
                    const ids = achievementsToShow.map(ua => ua.id)
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
        return undefined;
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
