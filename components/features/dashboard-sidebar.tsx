"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Home, Library, Bookmark, StickyNote, Quote, Users, Settings, ShoppingBag, Sparkles, BarChart3 } from "lucide-react"
import { AnimatedLogo } from "@/components/ui/animated-logo"

export function DashboardSidebar() {
    const pathname = usePathname()

    const routes = [
        {
            label: "Dashboard",
            icon: Home,
            href: "/dashboard",
        },
        {
            label: "Library",
            icon: Library,
            href: "/dashboard/library",
        },
        {
            label: "Bookmarks",
            icon: Bookmark,
            href: "/dashboard/bookmarks",
        },
        {
            label: "Notes",
            icon: StickyNote,
            href: "/dashboard/notes",
        },
        {
            label: "Quotes",
            icon: Quote,
            href: "/dashboard/quotes",
        },
        {
            label: "Marketplace",
            icon: ShoppingBag,
            href: "/dashboard/marketplace",
        },
        {
            label: "AI Assistant",
            icon: Sparkles,
            href: "/dashboard/ai-assistant",
        },
        {
            label: "Community",
            icon: Users,
            href: "/dashboard/community",
        },
        {
            label: "Analytics",
            icon: BarChart3,
            href: "/dashboard/analytics",
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/dashboard/settings",
        },
    ]

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border/50 transition-colors duration-300">
            <div className="px-3 py-2">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <AnimatedLogo />
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => {
                        const Icon = route.icon
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative",
                                    isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full top-1/2 -translate-y-1/2"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className="flex items-center flex-1 pl-1">
                                    <Icon className={cn("h-5 w-5 mr-3 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                                    <span className="relative">
                                        {route.label}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
