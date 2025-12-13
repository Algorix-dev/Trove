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

    const client = createServerClient(
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
        }
    )

    // WORKAROUND: Intercept getUser to inject manual token if needed
    const originalGetUser = client.auth.getUser.bind(client.auth)
    client.auth.getUser = async (jwt?: string) => {
        // If JWT provided, use it
        if (jwt) return originalGetUser(jwt)

        // Try standard extraction
        const result = await originalGetUser()
        if (result.data.user) return result

        // If failed but we manually parsed a token, try that
        if (accessToken) {
            return originalGetUser(accessToken)
        }

        return result
    }

        // DEBUG: Expose token
        ; (client as any).debugToken = accessToken ? (accessToken.substring(0, 5) + "...") : "Undefined"

    return client
}
