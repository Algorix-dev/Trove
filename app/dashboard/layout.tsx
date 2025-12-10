"use client"

import { DashboardSidebar } from "@/components/features/dashboard-sidebar"
import { DashboardHeader } from "@/components/features/dashboard-header"
import { AuthGuard } from "@/components/features/auth-guard"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <DashboardSidebar />
            </div>
            <main className="md:pl-72">
                <DashboardHeader />
                <div className="p-8">
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </div>
            </main>
        </div>
    )
}
