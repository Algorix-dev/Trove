"use client"

import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

export function AnimatedLogo() {
    return (
        <motion.div
            className="flex items-center gap-2 group cursor-pointer"
            whileHover="hover"
            initial="initial"
        >
            <div className="relative">
                <motion.div
                    variants={{
                        initial: { rotateY: 0 },
                        hover: { rotateY: [0, -20, 0], transition: { duration: 0.8, repeat: Infinity } }
                    }}
                    className="relative z-10"
                >
                    <BookOpen className="h-8 w-8 text-primary fill-primary/10" />
                </motion.div>

                {/* Glow effect */}
                <motion.div
                    variants={{
                        initial: { opacity: 0, scale: 0.8 },
                        hover: { opacity: 1, scale: 1.2 }
                    }}
                    className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"
                />
            </div>

            <motion.h1
                className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
                variants={{
                    initial: { backgroundPosition: "0% center" },
                    hover: {
                        backgroundPosition: "200% center",
                        transition: { duration: 2, repeat: Infinity, ease: "linear" }
                    }
                }}
            >
                Trove
            </motion.h1>
        </motion.div>
    )
}
