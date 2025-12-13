// app/dashboard/community/page.tsx
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Users, TrendingUp, BookOpen, ExternalLink } from "lucide-react"

export default function CommunityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Community</h1>
                <p className="text-muted-foreground">Connect with fellow readers and share your journey</p>
            </div>

            {/* Discord Community */}
            <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">Join Our Discord Community</h2>
                        <p className="text-muted-foreground mb-4">
                            Connect with thousands of readers, share book recommendations, participate in reading challenges, and discuss your favorite books!
                        </p>
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-medium">5,000+ Members</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-medium">Active Daily</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-medium">Book Clubs</span>
                            </div>
                        </div>
                        <Button className="bg-indigo-500 hover:bg-indigo-600" asChild>
                            <a href="https://discord.gg/trove-readers" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Join Discord Server
                                <ExternalLink className="h-3 w-3 ml-2" />
                            </a>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Community Features */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Book Clubs</h3>
                    <p className="text-sm text-muted-foreground">
                        Join monthly book clubs and read together with the community
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Reading Challenges</h3>
                    <p className="text-sm text-muted-foreground">
                        Participate in reading challenges and compete with friends
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                        <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Discussion Forums</h3>
                    <p className="text-sm text-muted-foreground">
                        Engage in deep discussions about books, authors, and genres
                    </p>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent Community Activity</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 pb-4 border-b">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                        <div className="flex-1">
                            <p className="text-sm"><span className="font-medium">Sarah M.</span> started a discussion on "The Midnight Library"</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 pb-4 border-b">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500" />
                        <div className="flex-1">
                            <p className="text-sm"><span className="font-medium">Book Club</span> completed "Project Hail Mary"</p>
                            <p className="text-xs text-muted-foreground">5 hours ago</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500" />
                        <div className="flex-1">
                            <p className="text-sm"><span className="font-medium">Reading Challenge</span> "Summer Reading 2024" has 234 participants</p>
                            <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
