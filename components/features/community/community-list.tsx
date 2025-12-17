"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, MessageCircle, Search, BookOpen, Sparkles, Rocket, Brain, Palette } from "lucide-react"
import { CommunityInviteModal } from "./community-invite-modal"
import Link from "next/link"

// Fixed community categories
const communities = [
    {
        id: "fiction",
        name: "Fiction Lovers",
        description: "Dive into imaginary worlds, compelling characters, and unforgettable stories.",
        icon: BookOpen,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        members: 2456,
        activeUsers: 145,
        discordUrl: "https://discord.gg/your-fiction-channel" // Replace with actual Discord link
    },
    {
        id: "non-fiction",
        name: "Non-Fiction Hub",
        description: "Real stories, biographies, history, and knowledge that expands your mind.",
        icon: Brain,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        members: 1823,
        activeUsers: 98,
        discordUrl: "https://discord.gg/your-nonfiction-channel"
    },
    {
        id: "manga-anime",
        name: "Manga & Anime",
        description: "Japanese comics, light novels, and anime adaptations. All things otaku!",
        icon: Sparkles,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        members: 3421,
        activeUsers: 234,
        discordUrl: "https://discord.gg/your-manga-channel"
    },
    {
        id: "scifi-fantasy",
        name: "Sci-Fi & Fantasy",
        description: "Epic adventures, magical realms, futuristic worlds, and everything speculative.",
        icon: Rocket,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        members: 2891,
        activeUsers: 167,
        discordUrl: "https://discord.gg/your-scifi-channel"
    },
    {
        id: "self-development",
        name: "Self-Development",
        description: "Personal growth, productivity, mindfulness, and becoming your best self.",
        icon: Palette,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        members: 1567,
        activeUsers: 89,
        discordUrl: "https://discord.gg/your-selfdev-channel"
    },
]

export function CommunityList() {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                        const Icon = community.icon
                        return (
                            <Card key={community.id} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-3 rounded-lg ${community.bgColor}`}>
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
                                            <span>{community.members.toLocaleString()} members</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{community.activeUsers} active</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1"
                                            asChild
                                        >
                                            <Link href={community.discordUrl} target="_blank" rel="noopener noreferrer">
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
