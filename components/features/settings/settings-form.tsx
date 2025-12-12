"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Bell, Mail } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SettingsForm({ profile }: { profile: any | null }) {
    const [fullName, setFullName] = useState(profile?.full_name || "")
    const [username, setUsername] = useState(profile?.username || "")
    const [email, setEmail] = useState(profile?.email || "")
    const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes ?? 30)
    const [loading, setLoading] = useState(false)
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [inAppNotifications, setInAppNotifications] = useState(true)
    const router = useRouter()
    const supabase = createBrowserSupabaseClient()

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "")
            setUsername(profile.username || "")
            setEmail(profile.email || "")
            setDailyGoal(profile.daily_goal_minutes || 30)
        }
    }, [profile])

    const handleSaveProfile = async () => {
        setLoading(true)
        try {
            // Validate username
            if (username) {
                const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
                if (!usernameRegex.test(username)) {
                    toast.error("Username must be 3-20 characters and contain only letters, numbers, or underscores.")
                    setLoading(false)
                    return
                }
            }

            // Update profiles table (server RLS requires authenticated user)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username || null,
                    daily_goal_minutes: dailyGoal
                })
                .eq('id', profile?.id)

            if (profileError) {
                if ((profileError as any).code === '23505') {
                    toast.error("Username is already taken.")
                    setLoading(false)
                    return
                }
                throw profileError
            }

            // Update email in auth if changed (requires valid session)
            if (email !== profile?.email) {
                const { error: authError } = await supabase.auth.updateUser({ email })
                if (authError) throw authError
            }

            router.refresh()
            toast.success("Profile updated successfully!")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to update profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter a unique username" />
                        <p className="text-xs text-muted-foreground">This will be displayed on your dashboard greeting.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                        <p className="text-xs text-muted-foreground">Changing your email will require verification</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveProfile} disabled={loading}>
                        {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : ("Save Changes")}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader><CardTitle>Reading Goals</CardTitle><CardDescription>Set your daily reading targets.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Daily Goal</Label>
                            <span className="font-medium">{dailyGoal} minutes</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">15m</span>
                            <input type="range" min="15" max="120" step="5" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value))} className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer" />
                            <span className="text-xs text-muted-foreground">120m</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Aim to read for at least {dailyGoal} minutes every day to build your streak.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Manage how you receive updates and reminders.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /><Label>In-App Notifications</Label></div>
                            <p className="text-sm text-muted-foreground">Get notified about streaks, achievements, and reading milestones</p>
                        </div>
                        <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><Label>Email Updates (Coming Soon)</Label></div>
                            <p className="text-sm text-muted-foreground">Receive weekly reading summaries and motivational messages</p>
                        </div>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
