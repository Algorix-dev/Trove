// app/dashboard/ai-assistant/page.tsx
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, BookOpen, Lightbulb, MessageSquare, TrendingUp } from "lucide-react"

export default function AIAssistantPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-purple-500" />
                    AI Reading Assistant
                </h1>
                <p className="text-muted-foreground">Enhance your reading experience with AI-powered insights</p>
            </div>

            {/* AI Features Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Book Summaries */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Smart Summaries</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Get AI-generated chapter summaries and key takeaways from your books
                    </p>
                    <Button variant="outline" className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Summary
                    </Button>
                </Card>

                {/* Reading Insights */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                        <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Reading Insights</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Discover patterns in your reading habits and get personalized recommendations
                    </p>
                    <Button variant="outline" className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        View Insights
                    </Button>
                </Card>

                {/* Discussion Questions */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Discussion Questions</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        AI-generated thought-provoking questions for deeper understanding
                    </p>
                    <Button variant="outline" className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get Questions
                    </Button>
                </Card>

                {/* Smart Recommendations */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                        <Lightbulb className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Personalized book suggestions based on your reading history and preferences
                    </p>
                    <Button variant="outline" className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get Recommendations
                    </Button>
                </Card>
            </div>

            {/* AI Chat Assistant */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">AI Reading Companion</h2>
                        <p className="text-muted-foreground mb-4">
                            Ask questions about your books, get explanations of complex passages, or discuss themes and characters with our AI assistant.
                        </p>
                        <div className="bg-background/50 rounded-lg p-4 mb-4 border">
                            <p className="text-sm italic text-muted-foreground">
                                "What are the main themes in this chapter?"
                            </p>
                            <p className="text-sm italic text-muted-foreground mt-2">
                                "Explain this concept in simpler terms"
                            </p>
                            <p className="text-sm italic text-muted-foreground mt-2">
                                "Recommend similar books to what I'm reading"
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Start Conversation
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Coming Soon */}
            <Card className="p-6 border-dashed">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Coming Soon
                </h3>
                <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>Voice narration with AI-generated voices</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>Automatic vocabulary building from your reading</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>AI-powered speed reading assistance</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
