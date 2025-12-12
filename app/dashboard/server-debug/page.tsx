import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"

export const dynamic = 'force-dynamic'

export default async function ServerDebugPage() {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    const headerStore = headers()
    const middlewareCookies = headerStore.get('x-middleware-cookies') || "MISSING HEADER"
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set (Starts with " + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8) + ")" : "MISSING!"

    return (
        <div className="p-8 bg-black min-h-screen text-green-400 font-mono text-sm space-y-6">
            <h1 className="text-2xl text-white font-bold">SERVER-SIDE DEBUG</h1>

            <section className="space-y-2 border border-purple-800 p-4 rounded bg-purple-950/20">
                <h2 className="text-xl text-white">0. Environment & Middleware Probe</h2>
                <div className="bg-gray-900 p-4 rounded space-y-2">
                    <div><strong>Supabase URL (Env):</strong> {envUrl}</div>
                    <div className="break-all"><strong>Cookies Seen by Middleware:</strong> <br />{middlewareCookies}</div>
                </div>
            </section>

            <section className="space-y-2 border border-blue-800 p-4 rounded bg-blue-950/20">
                <h2 className="text-xl text-white">1. Server Auth Status</h2>
                <div className="bg-gray-900 p-4 rounded">
                    <div><strong>User ID:</strong> {user?.id || "NULL"}</div>
                    <div><strong>Error:</strong> {error?.message || "None"}</div>
                </div>
            </section>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">2. Raw Cookies Received by Server</h2>
                <div className="bg-gray-900 p-4 rounded overflow-auto text-xs break-all max-h-96">
                    {allCookies.length === 0 ? "NO COOKIES RECEIVED" : (
                        <ul className="list-disc pl-4">
                            {allCookies.map(c => (
                                <li key={c.name} className="mb-2">
                                    <span className="text-yellow-400">{c.name}</span>
                                    <span className="text-gray-500 mx-2">=</span>
                                    <span className="text-gray-300">{c.value.substring(0, 20)}... ({c.value.length} chars)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    )
}
