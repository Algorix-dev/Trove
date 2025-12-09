"use client"

import { BookOpen, Upload, Trophy, BarChart3 } from "lucide-react"
import { UploadModal } from "./upload-modal"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function EmptyLibrary() {
    const [uploadOpen, setUploadOpen] = useState(false)

    const steps = [
        {
            icon: Upload,
            title: "Upload Books",
            description: "Import your favorite PDF, EPUB, or TXT files."
        },
        {
            icon: BarChart3,
            title: "Track Progress",
            description: "Automatically save your page and reading time."
        },
        {
            icon: Trophy,
            title: "Earn Rewards",
            description: "Unlock achievements and level up as you read."
        }
    ]

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-500">
            <div className="text-center mb-10 max-w-2xl">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6 ring-8 ring-primary/5">
                    <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">Welcome to your Library</h2>
                <p className="text-muted-foreground text-lg">
                    Your personal reading sanctuary is ready. Let's get you valid started!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
                {steps.map((step, i) => (
                    <Card key={i} className="p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow bg-muted/30 border-muted">
                        <div className="h-12 w-12 rounded-xl bg-background shadow-sm flex items-center justify-center mb-4 text-primary">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                    </Card>
                ))}
            </div>

            <Button
                size="lg"
                onClick={() => setUploadOpen(true)}
                className="h-12 px-8 text-base shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
                <Upload className="mr-2 h-5 w-5" />
                Upload Your First Book
            </Button>

            <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
        </div>
    )
}
