"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"

interface AchievementConfettiProps {
    duration?: number
}

export function AchievementConfetti({ duration = 5000 }: AchievementConfettiProps) {
    const { width, height } = useWindowSize()
    const [show, setShow] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setShow(false), duration)
        return () => clearTimeout(timer)
    }, [duration])

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
