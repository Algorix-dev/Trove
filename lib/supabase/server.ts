import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createServerSupabaseClient() {
    const cookieStore = cookies()

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
            }
        }
    )
}
