"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, BookOpen } from "lucide-react"

interface WelcomeAnimationProps {
    message?: string
    onComplete?: () => void
    duration?: number
}

export function WelcomeAnimation({ 
    message = "Welcome to Your Treasures", 
    onComplete,
    duration = 3000 
}: WelcomeAnimationProps) {
    const [show, setShow] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false)
            onComplete?.()
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onComplete])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                    {/* Background overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Main animation container */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        {/* Bubble pop animation */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0, 1.2, 1],
                                opacity: [0, 1, 1],
                                rotate: [0, 10, -10, 0]
                            }}
                            exit={{ 
                                scale: [1, 1.2, 0],
                                opacity: [1, 1, 0]
                            }}
                            transition={{ 
                                duration: 0.6,
                                ease: "easeOut"
                            }}
                            className="relative"
                        >
                            {/* Sparkle effects */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ 
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0],
                                        x: Math.cos((i * Math.PI * 2) / 6) * 60,
                                        y: Math.sin((i * Math.PI * 2) / 6) * 60,
                                    }}
                                    transition={{ 
                                        duration: 1,
                                        delay: 0.3 + i * 0.1,
                                        ease: "easeOut"
                                    }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </motion.div>
                            ))}

                            {/* Main icon */}
                            <div className="relative bg-primary/10 rounded-full p-6 border-2 border-primary/20">
                                <BookOpen className="h-12 w-12 text-primary" />
                            </div>
                        </motion.div>

                        {/* Text animation */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                {message}
                            </h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-sm text-muted-foreground mt-2"
                            >
                                Your reading journey begins here
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

