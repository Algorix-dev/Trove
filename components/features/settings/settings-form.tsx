"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Bell, Mail } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SettingsForm() {
    const [fullName, setFullName] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [dailyGoal, setDailyGoal] = useState(30)
    const [loading, setLoading] = useState(false)
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [inAppNotifications, setInAppNotifications] = useState(true)
    const { user } = useAuth()
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (user) {
            setEmail(user.email || "")
            // Fetch profile data
            const fetchProfile = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, username, daily_goal_minutes')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setFullName(data.full_name || user.user_metadata?.full_name || "")
                    setUsername(data.username || "")
                    setDailyGoal(data.daily_goal_minutes || 30)
                }
            }
            fetchProfile()
        }
    }, [user])

    const handleSaveProfile = async () => {
        if (!user) return

        // Validate username
        if (username) {
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
            if (!usernameRegex.test(username)) {
                toast.error("Username must be 3-20 characters and contain only letters, numbers, or underscores.")
                return
            }
        }

        setLoading(true)
        try {
            // Update profile in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username || null,
                    daily_goal_minutes: dailyGoal
                })
                .eq('id', user.id)

            if (profileError) {
                if (profileError.code === '23505') { // Unique violation
                    toast.error("Username is already taken.")
                    return
                }
                throw profileError
            }

            // Update email in auth if changed
            if (email !== user.email) {
                const { error: authError } = await supabase.auth.updateUser({
                    email: email
                })
                if (authError) throw authError
            }

            router.refresh()
            toast.success("Profile updated successfully!")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
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
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter a unique username"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be displayed on your dashboard greeting.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                        <p className="text-xs text-muted-foreground">
                            Changing your email will require verification
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveProfile} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Reading Goals</CardTitle>
                    <CardDescription>Set your daily reading targets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Daily Goal</Label>
                            <span className="font-medium">{dailyGoal} minutes</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">15m</span>
                            <input
                                type="range"
                                min="15"
                                max="120"
                                step="5"
                                value={dailyGoal}
                                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-muted-foreground">120m</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Aim to read for at least {dailyGoal} minutes every day to build your streak.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive updates and reminders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <Label>In-App Notifications</Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Get notified about streaks, achievements, and reading milestones
                            </p>
                        </div>
                        <Switch
                            checked={inAppNotifications}
                            onCheckedChange={setInAppNotifications}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <Label>Email Updates (Coming Soon)</Label>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Receive weekly reading summaries and motivational messages
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                            disabled
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
