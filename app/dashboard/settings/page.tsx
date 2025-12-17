import { SettingsForm } from "@/components/features/settings/settings-form"
import { Sparkles } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 max-w-5xl mx-auto">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>User Preferences</span>
                </div>
                <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent italic">
                    Configure Trove
                </h2>
                <p className="text-muted-foreground text-lg font-medium">
                    Adjust your sanctuary to fit your reading style.
                </p>
            </div>
            <SettingsForm />
        </div>
    )
}

