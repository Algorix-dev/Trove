"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [currentTheme, setCurrentTheme] = useState<string | undefined>(undefined)
    const [isTransitioning, setIsTransitioning] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            setCurrentTheme(resolvedTheme)
        }
    }, [mounted, resolvedTheme])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <Moon className="h-5 w-5" />
            </Button>
        )
    }

    const isDark = currentTheme === "dark"

    const toggleTheme = () => {
        setIsTransitioning(true)
        
        // Use View Transition API for smooth animated theme change
        if ('startViewTransition' in document) {
            const transition = (document as any).startViewTransition(() => {
                setTheme(isDark ? "light" : "dark")
            })
            
            transition.finished.finally(() => {
                setIsTransitioning(false)
            })
        } else {
            // Fallback for browsers without View Transition API
            setTheme(isDark ? "light" : "dark")
            setTimeout(() => setIsTransitioning(false), 400)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative group overflow-visible"
            disabled={isTransitioning}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {/* Icon container with smooth rotation */}
            <div className="relative w-5 h-5">
                {/* Sun icon - visible in dark mode */}
                <Sun 
                    className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
                        isDark 
                            ? 'opacity-100 rotate-0 scale-100' 
                            : 'opacity-0 rotate-90 scale-0'
                    } ${isTransitioning ? 'animate-pulse' : ''}`}
                />
                
                {/* Moon icon - visible in light mode */}
                <Moon 
                    className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
                        !isDark 
                            ? 'opacity-100 rotate-0 scale-100' 
                            : 'opacity-0 -rotate-90 scale-0'
                    } ${isTransitioning ? 'animate-pulse' : ''}`}
                />
            </div>
            
            {/* Subtle glow effect on hover */}
            <span 
                className={`absolute inset-0 rounded-md ${
                    isDark 
                        ? 'bg-yellow-500/20 group-hover:bg-yellow-500/30' 
                        : 'bg-blue-500/20 group-hover:bg-blue-500/30'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10`}
            />
            
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
