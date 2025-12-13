import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => req.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // This call is REQUIRED to refresh the session cookie
    await supabase.auth.getSession()

    return res
}

export const config = {
    matcher: ["/dashboard/:path*"],
}
