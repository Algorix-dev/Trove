"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, MessageCircle, Search, BookOpen, Sparkles, Rocket, Brain, Palette } from "lucide-react"
import { CommunityInviteModal } from "./community-invite-modal"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { useEffect } from "react"



export function CommunityList() {
    const [searchQuery, setSearchQuery] = useState("")
    const [communities, setCommunities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCommunities = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .order('member_count', { ascending: false })

            if (data) {
                setCommunities(data)
            }
            if (error) {
                console.error("Error fetching communities:", error)
            }
            setLoading(false)
        }

        fetchCommunities()
    }, [])

    // Map string icon names to Lucide components
    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            BookOpen, Brain, Sparkles, Rocket, Palette
        }
        return icons[iconName] || BookOpen
    }

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search communities..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Communities Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCommunities.length > 0 ? (
                    filteredCommunities.map((community) => {
                        const Icon = getIcon(community.icon_name)
                        return (
                            <Card key={community.id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-3 rounded-lg ${community.bg_color}`}>
                                            <Icon className={`h-6 w-6 ${community.color}`} />
                                        </div>
                                    </div>
                                    <CardTitle>{community.name}</CardTitle>
                                    <CardDescription>{community.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{community.member_count.toLocaleString()} members</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{community.active_count} active</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1"
                                            asChild
                                        >
                                            <Link href={community.discord_url || '#'} target="_blank" rel="noopener noreferrer">
                                                Join Discussion
                                            </Link>
                                        </Button>
                                        <CommunityInviteModal
                                            communityId={community.id}
                                            communityName={community.name}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">No communities found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    )
}
