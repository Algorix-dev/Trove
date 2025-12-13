import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createServerSupabaseClient() {
    const cookieStore = cookies()

    // WORKAROUND: Manually parse session token bypassing broken library cookie handling
    let accessToken: string | undefined = undefined
    try {
        const name = "sb-oywgbszdxsklkvwifvqq-auth-token"
        const all = cookieStore.getAll()
        const chunks = all
            .filter(c => c.name.startsWith(name))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => c.value)

        if (chunks.length > 0) {
            const combined = chunks.join("")
            const cleaned = combined.replace("base64-", "")
            const decoded = Buffer.from(cleaned, 'base64').toString('utf-8')
            const session = JSON.parse(decoded)
            if (session.access_token) {
                accessToken = session.access_token
            }
        }
    } catch (e) {
        // Ignore parsing errors, fall back to standard library check
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() {
                    // ❗ DO NOTHING — SERVER COMPONENTS CANNOT SET COOKIES
                },
            },
            cookieOptions: {
                name: "sb-oywgbszdxsklkvwifvqq-auth-token"
            },
            global: accessToken ? {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            } : undefined
        }
    )
}
