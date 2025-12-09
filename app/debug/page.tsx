import { createClient } from "@/lib/supabase/server"
import { createBrowserClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: { user: serverUser }, error: serverError } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map(c => c.name)

    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    return (
        <div className="p-8 space-y-8 font-mono text-sm">
            <h1 className="text-2xl font-bold">🕵️‍♂️ Auth Debugger</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="border p-4 rounded bg-muted/20">
                    <h2 className="font-bold mb-2">🌍 Server Side</h2>
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify({
                            hasUser: !!serverUser,
                            userId: serverUser?.id,
                            email: serverUser?.email,
                            error: serverError?.message,
                            envUrlPrefix: serverUrl?.substring(0, 15) + '...',
                            cookiesReceived: allCookies
                        }, null, 2)}
                    </pre>
                </div>

                <ClientDebug />
            </div>
        </div>
    )
}

function ClientDebug() {
    "use client"
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // We need to fetch client user async
    const checkUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL

        document.getElementById('client-debug')!.textContent = JSON.stringify({
            hasUser: !!user,
            userId: user?.id,
            email: user?.email,
            error: error?.message,
            envUrlPrefix: url?.substring(0, 15) + '...',
        }, null, 2)
    }

    // Check on mount
    import('react').then(r => r.useEffect(() => { checkUser() }, []))

    return (
        <div className="border p-4 rounded bg-blue-50/10 border-blue-200/20">
            <h2 className="font-bold mb-2 text-blue-400">💻 Client Side</h2>
            <pre id="client-debug" className="whitespace-pre-wrap">Loading...</pre>
            <button onClick={checkUser} className="mt-4 bg-blue-600 px-3 py-1 rounded text-white text-xs">Refresh Client</button>
        </div>
    )
}
