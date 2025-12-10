"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { type User } from "@supabase/supabase-js"

type AuthContextType = {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
<<<<<<< HEAD
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
=======
    const [supabase] = useState(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ))

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
>>>>>>> 45bc0a3 (Fix authentication loops and implement dashboard features)

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
