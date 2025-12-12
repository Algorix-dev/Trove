// app/dashboard/settings/page.tsx
import { SettingsForm } from "@/components/features/settings/settings-form"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
    const supabase = createServerSupabaseClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) return null

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, username")
        .eq("id", userId)
        .single()

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            <SettingsForm profile={profile ?? null} />
        </div>
    )
}
