"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { type User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

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
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
                setLoading(false)
            } catch (error) {
                console.error('Error getting session:', error)
                setLoading(false)
            }
        }

        initializeAuth()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email)
            setUser(session?.user ?? null)
            setLoading(false)

            // Refresh the page on sign in/out to update server components
            if (event === 'SIGNED_IN') {
                router.refresh()
            }
            if (event === 'SIGNED_OUT') {
                router.push('/login')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, router])

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
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
