import { DashboardSidebar } from "@/components/features/dashboard-sidebar"
import { DashboardHeader } from "@/components/features/dashboard-header"

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
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
