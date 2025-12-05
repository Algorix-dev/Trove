"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/components/providers/auth-provider"

export function LandingNavbar() {
    const { user, loading } = useAuth()

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight">Trove</span>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                {loading ? (
                    <Button variant="ghost" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                ) : user ? (
                    <Link href="/dashboard">
                        <Button>Dashboard</Button>
                    </Link>
                ) : (
                    <>
                        <Link href="/login">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link href="/signup">
                            <Button>Get Started</Button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}
