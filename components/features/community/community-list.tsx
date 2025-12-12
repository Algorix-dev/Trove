"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, MessageCircle, Search } from "lucide-react"
import { CommunityInviteModal } from "./community-invite-modal"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export function CommunityList({ communities: initialCommunities }: { communities?: any[] }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [communities, setCommunities] = useState<any[]>(initialCommunities ?? [])
    const [loading, setLoading] = useState(!initialCommunities)

    useEffect(() => {
        if (initialCommunities) {
            setCommunities(initialCommunities)
            setLoading(false)
            return
        }
        let mounted = true
        const fetchCommunities = async () => {
            const supabase = createBrowserSupabaseClient()
            const { data, error } = await supabase.from('communities').select('*').order('member_count', { ascending: false })
            if (mounted) {
                if (data) setCommunities(data)
                if (error) console.error("Error fetching communities:", error)
                setLoading(false)
            }
        }
        fetchCommunities()
        return () => { mounted = false }
    }, [initialCommunities])

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = { BookOpen: undefined }
        return icons[iconName] || undefined
    }

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search communities..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCommunities.length > 0 ? filteredCommunities.map(community => (
                    <Card key={community.id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-3 rounded-lg ${community.bg_color || 'bg-muted'}`}>
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                            <CardTitle>{community.name}</CardTitle>
                            <CardDescription>{community.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{(community.member_count || 0).toLocaleString()} members</span></div>
                                <div className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /><span>{community.active_count || 0} active</span></div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1" asChild>
                                    <Link href={community.discord_url || '#'} target="_blank" rel="noopener noreferrer">Join Discussion</Link>
                                </Button>
                                <CommunityInviteModal communityId={community.id} communityName={community.name} />
                            </div>
                        </CardContent>
                    </Card>
                )) : <div className="col-span-full text-center py-12"><p className="text-muted-foreground">No communities found matching "{searchQuery}"</p></div>}
            </div>
        </div>
    )
}
