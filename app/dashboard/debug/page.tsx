import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { ClientDebug } from "./client-debug"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    const supabase = createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Safe Env Check (Masked)
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const envCheck = {
        url: sbUrl ? `${sbUrl.slice(0, 15)}...` : 'MISSING',
        key: sbKey ? `${sbKey.slice(0, 5)}...` : 'MISSING'
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 font-mono text-sm bg-neutral-900 text-green-400 min-h-screen">
            <h1 className="text-2xl font-bold text-white mb-8">SERVER-SIDE DIAGNOSTIC</h1>

            <section className="space-y-4 border p-4 rounded border-green-800">
                <h2 className="text-xl font-bold text-white">1. Environment Variables</h2>
                <pre>{JSON.stringify(envCheck, null, 2)}</pre>
                <p className="text-gray-400">If these say "MISSING" or look wrong compared to your local .env.local, check Vercel Settings.</p>
            </section>

            <section className="space-y-4 border p-4 rounded border-green-800">
                <h2 className="text-xl font-bold text-white">2. Cookies Visible to Server</h2>
                {allCookies.length === 0 ? (
                    <p className="text-red-500 font-bold">NO COOKIES FOUND (Browser not sending them?)</p>
                ) : (
                    <ul className="list-disc pl-5 space-y-2">
                        {allCookies.map(c => (
                            <li key={c.name} className="break-all">
                                <span className="font-bold text-white">{c.name}</span>
                                <br />
                                <span className="text-xs opacity-70">
                                    Size: {c.value.length} chars
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="space-y-4 border p-4 rounded border-green-800">
                <h2 className="text-xl font-bold text-white">3. Supabase Auth Status</h2>

                <div className="grid grid-cols-1 gap-4">
                    <div className={`p-2 rounded ${session ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                        <strong>Session:</strong> {session ? 'ACTIVE ✅' : 'NULL ❌'}
                    </div>
                    {sessionError && (
                        <div className="p-2 bg-red-900/50 rounded">
                            <strong>Session Error:</strong> {sessionError.message}
                        </div>
                    )}

                    <div className={`p-2 rounded ${user ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                        <strong>User:</strong> {user ? 'ACTIVE ✅' : 'NULL ❌'}
                    </div>
                    {userError && (
                        <div className="p-2 bg-red-900/50 rounded">
                            <strong>User Error:</strong> {userError.message}
                        </div>
                    )}
                </div>

                {user && (
                    <pre className="mt-4 p-2 bg-black rounded overflow-auto max-h-40">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                )}
            </section>

            <ClientDebug />
        </div>
    )
}
