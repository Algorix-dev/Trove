"use client"

import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"

export function DashboardHeader() {
    return (
        <div className="flex items-center justify-end gap-2 p-4 border-b h-16">
            <ThemeToggle />
            <Link href="/dashboard/profile">
                <Button variant="ghost" size="icon">
                    <UserCircle className="h-6 w-6" />
                </Button>
            </Link>
        </div>
    )
}
