import { CommunityList } from "@/components/features/community/community-list"

export default function CommunityPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Community</h2>
                <p className="text-muted-foreground">
                    Join discussions with fellow readers in our curated communities
                </p>
            </div>
            <CommunityList />
        </div>
    )
}
