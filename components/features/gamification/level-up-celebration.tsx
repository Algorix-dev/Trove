"use client"

import { useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { createBrowserClient } from '@supabase/ssr'
import confetti from 'canvas-confetti'
export function LevelUpCelebration() {
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return

        const checkLevelUp = async () => {
            const supabase = createBrowserClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
            )

            const { data: profile } = await supabase
                .from('profiles')
                .select('current_level')
                .eq('id', user.id)
                .single()

            if (!profile) return

            const currentLevel = profile.current_level

            // Check session storage for last celebrated level
            const sessionKey = `lastLevel_${user.id}`
            const storedLastLevel = sessionStorage.getItem(sessionKey)

            if (storedLastLevel) {
                const lastLevelNum = parseInt(storedLastLevel)

                // If level increased, celebrate!
                if (currentLevel > lastLevelNum) {
                    celebrate(currentLevel)
                    sessionStorage.setItem(sessionKey, currentLevel.toString())
                }
            } else {
                // First time - just store current level
                sessionStorage.setItem(sessionKey, currentLevel.toString())
            }
        }

        checkLevelUp()

        // Check every 10 seconds
        const interval = setInterval(checkLevelUp, 10000)
        return () => clearInterval(interval)
    }, [user])

    const celebrate = (newLevel: number) => {
        // Epic confetti burst
        const duration = 4000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            })
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            })
        }, 250)

        // Show celebration banner
        const celebrationDiv = document.createElement('div')
        celebrationDiv.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-12 py-8 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-700 text-center border-4 border-white/20'
        celebrationDiv.innerHTML = `
            <div class="flex flex-col items-center gap-4">
                <svg class="w-20 h-20 text-yellow-300 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <div>
                    <div class="text-4xl font-bold mb-2">LEVEL UP!</div>
                    <div class="text-6xl font-black text-yellow-300 mb-2">${newLevel}</div>
                    <div class="text-lg opacity-90">You've reached a new level!</div>
                    <div class="text-sm opacity-75 mt-2">Keep reading to unlock more achievements</div>
                </div>
            </div>
        `
        document.body.appendChild(celebrationDiv)

        // Remove after 5 seconds
        setTimeout(() => {
            celebrationDiv.style.animation = 'zoom-out 0.5s ease-in-out'
            setTimeout(() => celebrationDiv.remove(), 500)
        }, 5000)
    }

    return null
}
