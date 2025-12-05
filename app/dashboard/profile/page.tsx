import { ProfileHeader } from "@/components/features/profile/profile-header"
import { BadgesList } from "@/components/features/profile/badges-list"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Mock stats for now (would fetch from DB in real app)
    const stats = {
        booksRead: 12,
        streak: 5,
        totalMinutes: 1450
    }

    // Combine auth user data with profile data
    const userData = {
        full_name: profile?.full_name || user.user_metadata?.full_name,
        email: user.email,
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        created_at: user.created_at
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <ProfileHeader user={userData} stats={stats} />
            <BadgesList />
        </div>
    )
}
