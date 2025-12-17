"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Library, BookOpen, Bookmark, StickyNote, Quote, Users, Settings, ShoppingBag, Sparkles, BarChart3 } from "lucide-react"

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
        <div className="space-y-4 py-4 flex flex-col h-full bg-card border-r transition-colors duration-300">
            <div className="px-3 py-2">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <BookOpen className="h-8 w-8 text-primary mr-2" />
                    <h1 className="text-2xl font-bold">Trove</h1>
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
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                                    {route.label}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
