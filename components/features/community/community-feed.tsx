"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function CommunityFeed({ communityId }: { communityId?: string }) {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadPosts()
    }, [communityId])

    const loadPosts = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from("community_posts")
                .select(`
                    *,
                    profiles:user_id (
                        nickname,
                        full_name,
                        avatar_url
                    )
                `)
                .order("created_at", { ascending: false })

            if (communityId) {
                query = query.eq("community_id", communityId)
            }

            const { data, error } = await query
            if (error) throw error
            setPosts(data || [])
        } catch (error) {
            console.error("Feed error:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-[2rem]" />)}
    </div>

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {posts.map((post, idx) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-card/30 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-8 shadow-xl hover:shadow-primary/10 transition-shadow group"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4 items-center">
                                <Avatar className="w-14 h-14 border-2 border-background shadow-xl">
                                    <AvatarImage src={post.profiles?.avatar_url} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-black">
                                        {post.profiles?.nickname?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-black text-xl tracking-tight leading-none mb-1">
                                        {post.profiles?.nickname || post.profiles?.full_name || "Trove Reader"}
                                    </h4>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                                        {formatDistanceToNow(new Date(post.created_at))} ago
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>

                        <p className="text-xl text-foreground font-medium leading-relaxed mb-8 px-2">
                            {post.content}
                        </p>

                        <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                            <Button variant="ghost" size="sm" className="rounded-full px-6 hover:bg-pink-500/10 hover:text-pink-500 group">
                                <Heart className="w-5 h-5 mr-3 group-hover:fill-current" />
                                <span className="font-bold">{post.likes_count || 0}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-full px-6 hover:bg-primary/10 hover:text-primary">
                                <MessageCircle className="w-5 h-5 mr-3" />
                                <span className="font-bold">{post.comments_count || 0}</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full ml-auto">
                                <Share2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {posts.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                    <p className="text-xl font-bold text-muted-foreground">The knowledge feed is silent...</p>
                    <p className="text-sm text-muted-foreground">Be the first to share a spark of wisdom!</p>
                </div>
            )}
        </div>
    )
}
