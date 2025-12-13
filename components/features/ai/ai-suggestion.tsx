"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface AISuggestionProps {
    bookTitle?: string
}

export function AISuggestion({ bookTitle }: AISuggestionProps) {
    // Mock AI suggestions - no API calls, just UI
    const suggestions = [
        "Based on your reading pace, you'll finish this book in 3 days",
        "You read fastest between 8-10 PM",
        "Similar readers also enjoyed 'The Midnight Library'",
        "You're on track to meet your monthly reading goal!"
    ]

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

    return (
        <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">AI Insight</span>
                        <Badge variant="secondary" className="text-xs">Smart</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{randomSuggestion}</p>
                </div>
            </div>
        </Card>
    )
}
