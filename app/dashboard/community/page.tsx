// app/dashboard/community/page.tsx
import { CommunityList } from "@/components/features/community/community-list"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function CommunityPage() {
    const supabase = createServerSupabaseClient()

    const { data: communities } = await supabase
        .from("communities")
        .select("id, name, description, member_count")
        .order("member_count", { ascending: false })
        .limit(50)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Community</h2>
                <p className="text-muted-foreground">Join discussions with fellow readers in our curated communities</p>
            </div>
            <CommunityList communities={communities ?? []} />
        </div>
    )
}
