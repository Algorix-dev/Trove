"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { createBrowserClient } from '@supabase/ssr'
import confetti from 'canvas-confetti'

export function DailyGoalCelebration() {
    const { user } = useAuth()
    const [celebrated, setCelebrated] = useState(false)

    useEffect(() => {
        if (!user) return

        const checkDailyGoal = async () => {
            // Check if already celebrated today
            const todayKey = `dailyGoal_${new Date().toISOString().split('T')[0]}`
            if (sessionStorage.getItem(todayKey)) {
                return
            }

            const supabase = createBrowserClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
            )

            // Get user's daily goal from user_preferences
            const { data: preferences } = await supabase
                .from('user_preferences')
                .select('reading_goal_minutes')
                .eq('user_id', user.id)
                .single()

            if (!preferences) return

            // Get today's reading time
            const today = new Date().toISOString().split('T')[0]
            const { data: sessions } = await supabase
                .from('reading_sessions')
                .select('duration_minutes')
                .eq('user_id', user.id)
                .eq('session_date', today)

            const todayMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0

            // Check if goal is reached
            if (todayMinutes >= preferences.reading_goal_minutes && !celebrated) {
                celebrate()
                sessionStorage.setItem(todayKey, 'true')
                setCelebrated(true)
            }
        }

        // Check immediately
        checkDailyGoal()

        // Check every 30 seconds
        const interval = setInterval(checkDailyGoal, 30000)

        return () => clearInterval(interval)
    }, [user, celebrated])

    const celebrate = () => {
        // Duolingo-style celebration
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB']
        })

        // Show toast-style message
        const celebrationDiv = document.createElement('div')
        celebrationDiv.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full shadow-2xl animate-in slide-in-from-top-5 duration-500 flex items-center gap-3'
        celebrationDiv.innerHTML = `
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
            <div>
                <div class="font-bold text-lg">Daily Goal Achieved! 🎉</div>
                <div class="text-sm opacity-90">Great job on your reading streak!</div>
            </div>
        `
        document.body.appendChild(celebrationDiv)

        // Remove after 5 seconds
        setTimeout(() => {
            celebrationDiv.style.animation = 'slide-out-to-top 0.5s ease-in-out'
            setTimeout(() => celebrationDiv.remove(), 500)
        }, 5000)
    }

    return null
}
