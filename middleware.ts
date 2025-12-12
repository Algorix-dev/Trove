// middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // DEBUG: Log incoming cookies
    console.log('[Middleware] Incoming Cookies:', req.cookies.getAll().map(c => c.name))

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'trove-session',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        console.log('[Middleware] Setting Cookie:', name)
                        res.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Refresh session
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('[Middleware] User Found:', !!user, error?.message || 'No Error')

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
