"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Loader2,
    Bell,
    Upload,
    User,
    Shield,
    Target,
    Check
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
// No unnecessary avatar imports here since we use custom 3D logic
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const PRESET_AVATARS = [
    { id: "scholar", name: "The Scholar" },
    { id: "wizard", name: "The Wizard" },
    { id: "explorer", name: "The Explorer" },
    { id: "mentor", name: "The Mentor" },
    { id: "observer", name: "The Observer" },
]

export function SettingsForm() {
    const [activeTab, setActiveTab] = useState("profile")
    const [fullName, setFullName] = useState("")
    const [nickname, setNickname] = useState("")
    const [username, setUsername] = useState("")
    const [dailyGoal, setDailyGoal] = useState(30)
    const [loading, setLoading] = useState(false)
    const [emailNotifications] = useState(true)
    const [inAppNotifications, setInAppNotifications] = useState(true)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarChoice, setAvatarChoice] = useState<string>("default")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                loadProfile(user.id)
            }
        }
        checkUser()
    }, [])

    const loadProfile = async (userId: string) => {
        try {
            const [profileRes, preferencesRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single(),
                supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .single()
            ])

            if (profileRes.data) {
                setFullName(profileRes.data.full_name || "")
                setNickname(profileRes.data.nickname || "")
                setUsername(profileRes.data.username || "")
                setAvatarUrl(profileRes.data.avatar_url)
                setAvatarChoice(profileRes.data.avatar_choice || 'default')
            }

            if (preferencesRes.data) {
                setDailyGoal(preferencesRes.data.reading_goal_minutes || 30)
            }
        } catch (error) {
            console.error('Profile fetch error:', error)
        }
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !event.target.files?.[0]) return
        const file = event.target.files[0]
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)
            setAvatarChoice('upload')
            toast.success("Identity updated!")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleSave = async () => {
        if (!user) return
        setLoading(true)
        try {
            const [profileError, preferencesError] = await Promise.all([
                supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        nickname,
                        username,
                        avatar_url: avatarUrl || (avatarChoice !== 'default' && avatarChoice !== 'upload' ? `/avatars/${avatarChoice}.png` : null),
                        avatar_choice: avatarChoice
                    })
                    .eq('id', user.id),
                supabase
                    .from('user_preferences')
                    .update({
                        reading_goal_minutes: dailyGoal
                    })
                    .eq('user_id', user.id)
            ])

            if (profileError.error) throw profileError.error
            if (preferencesError.error) throw preferencesError.error

            toast.success("Sanctuary updated successfully!")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        { id: "profile", label: "Identity", icon: User },
        { id: "goals", label: "Discipline", icon: Target },
        { id: "notifications", label: "Alerts", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
    ]

    return (
        <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Navigation Sidebar */}
            <div className="lg:col-span-3 space-y-2 bg-muted/30 p-4 rounded-[2.5rem] border border-border/50 shadow-sm">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                    {activeTab === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[3rem] overflow-hidden">
                                <CardHeader className="p-10 pb-0">
                                    <CardTitle className="text-3xl font-black">Identity & Appearance</CardTitle>
                                    <CardDescription className="text-lg">How you manifest in the knowledge pool.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col md:flex-row gap-10 items-start">
                                        <div className="relative group">
                                            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl transition-transform group-hover:rotate-2">
                                                {avatarChoice !== 'upload' && avatarChoice !== 'default' ? (
                                                    <Image src={`/avatars/${avatarChoice}.png`} alt="Avatar" width={160} height={160} className="w-full h-full object-cover" />
                                                ) : avatarUrl ? (
                                                    <Image src={avatarUrl} alt="Avatar" width={160} height={160} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-5xl font-black">
                                                        {nickname?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform border-4 border-background"
                                            >
                                                <Upload className="w-5 h-5" />
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <Label className="text-xs font-black uppercase tracking-widest text-primary">Preset Archetypes</Label>
                                            <div className="grid grid-cols-5 gap-3">
                                                {PRESET_AVATARS.map(avatar => (
                                                    <button
                                                        key={avatar.id}
                                                        onClick={() => { setAvatarChoice(avatar.id); setAvatarUrl(null); }}
                                                        className={`aspect-square rounded-xl border-4 transition-all relative overflow-hidden group ${avatarChoice === avatar.id ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                                            }`}
                                                    >
                                                        <Image src={`/avatars/${avatar.id}.png`} alt={avatar.name} fill className="object-cover" />
                                                        {avatarChoice === avatar.id && (
                                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                                <Check className="w-6 h-6 text-white stroke-[4]" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fields */}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black uppercase tracking-widest opacity-50">Chosen Nickname</Label>
                                            <Input
                                                value={nickname}
                                                onChange={e => setNickname(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/30 border-none font-bold italic text-lg px-6"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black uppercase tracking-widest opacity-50">Global Username</Label>
                                            <Input
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-lg px-6"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <Label className="text-xs font-black uppercase tracking-widest opacity-50">Full Manifestation Name</Label>
                                            <Input
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-lg px-6 font-medium"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === "goals" && (
                        <motion.div
                            key="goals"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[3rem] p-10">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black">Reading Discipline</h3>
                                        <p className="text-muted-foreground text-lg">Define the intensity of your daily exploration.</p>
                                    </div>

                                    <div className="space-y-10 py-10">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-black uppercase tracking-widest opacity-50">Daily Commitment</Label>
                                                <div className="text-6xl font-black text-primary italic">
                                                    {dailyGoal} <span className="text-2xl text-muted-foreground not-italic">MINS</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-primary">Focus Level</p>
                                                <p className="text-2xl font-black italic">{dailyGoal >= 60 ? "Scholar" : dailyGoal >= 30 ? "Seeker" : "Scout"}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="15"
                                            max="120"
                                            step="5"
                                            value={dailyGoal}
                                            onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                                            className="w-full h-3 bg-muted/50 rounded-full appearance-none cursor-pointer accent-primary shadow-inner"
                                        />
                                        <div className="grid grid-cols-4 text-center text-[10px] font-black uppercase tracking-widest opacity-30">
                                            <span>Scout</span>
                                            <span>Seeker</span>
                                            <span>Scholar</span>
                                            <span>Master</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === "notifications" && (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl rounded-[3rem] p-10 pt-10">
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black">Thought Sparks</h4>
                                            <p className="text-muted-foreground italic">Real-time alerts for the Circle and your progress.</p>
                                        </div>
                                        <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} className="scale-125 data-[state=checked]:bg-primary" />
                                    </div>
                                    <div className="flex items-center justify-between opacity-50 group">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xl font-black text-muted-foreground">Dream Summaries</h4>
                                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-black">SOON</span>
                                            </div>
                                            <p className="text-muted-foreground italic">Weekly digests of your reading lore via raven.</p>
                                        </div>
                                        <Switch checked={emailNotifications} disabled className="scale-125" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save Button */}
                <div className="mt-10 flex justify-end">
                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        className="h-16 px-12 rounded-[2rem] text-xl font-black italic shadow-2xl shadow-primary/30 transition-transform active:scale-95 bg-primary"
                    >
                        {loading && <Loader2 className="w-6 h-6 mr-3 animate-spin" />}
                        Commit Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
