"use client"

import { Button } from "@/components/ui/button"
import { UserCircle, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardSidebar } from "@/components/features/dashboard-sidebar"

export function DashboardHeader() {
    return (
        <div className="flex items-center gap-2 p-4 border-b h-16 justify-between lg:justify-end">
            {/* Mobile Sidebar Trigger */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-0">
                        <DashboardSidebar />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link href="/dashboard/profile">
                    <Button variant="ghost" size="icon">
                        <UserCircle className="h-6 w-6" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
