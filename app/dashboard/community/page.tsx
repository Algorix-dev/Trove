"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CommunityList } from "@/components/features/community/community-list"
import { CommunityFeed } from "@/components/features/community/community-feed"
import { CreatePost } from "@/components/features/community/create-post"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Users, MessageSquare } from "lucide-react"

export default function CommunityPage() {
    const supabase = createClient()
    const [user, setUser] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()
    }, [])

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Social Hub</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        The Trove Circle
                    </h2>
                    <p className="text-muted-foreground text-lg font-medium">
                        Where knowledge meets conversation. Share thoughts, join clubs, find your tribe.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="feed" className="w-full">
                <div className="bg-muted/50 p-2 rounded-[2rem] inline-flex mb-8 shadow-inner border border-border/50">
                    <TabsList className="bg-transparent h-12 gap-2">
                        <TabsTrigger value="feed" className="rounded-full px-8 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Feed
                        </TabsTrigger>
                        <TabsTrigger value="groups" className="rounded-full px-8 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold">
                            <Users className="w-4 h-4 mr-2" />
                            Clubs & Groups
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="feed" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    {user && <CreatePost user={user} communityId="general" onPostCreated={() => setRefreshTrigger(prev => prev + 1)} />}
                    <CommunityFeed key={refreshTrigger} />
                </TabsContent>

                <TabsContent value="groups" className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <CommunityList />
                </TabsContent>
            </Tabs>
        </div>
    )
}

