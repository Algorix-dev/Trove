// app/dashboard/data-debug/page.tsx
import DataDebugClient from "@/components/debug/data-debug-client"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function DataDebugPage() {
    const supabase = createServerSupabaseClient()

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user ?? null

    // Counts
    const [{ count: booksCount }, { count: profilesCount }] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]).catch(() => [{ count: 0 }, { count: 0 }])

    // sample books
    const { data: booksSample } = await supabase
        .from("books")
        .select("id, title, author, cover_url, total_pages")
        .limit(10)

    const rawCookies = null // client-only; we'll let client read document.cookie

    return (
        <div className="p-8 bg-black min-h-screen text-green-400 font-mono text-sm space-y-6">
            <h1 className="text-2xl text-white font-bold">DATA ACCESS DIAGNOSTIC (Server)</h1>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">Auth User (Server)</h2>
                <pre className="bg-gray-900 p-2 rounded overflow-auto">{JSON.stringify(user ?? null, null, 2)}</pre>
            </section>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">RLS Table Counts (Server)</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-2 rounded"><strong>Books:</strong> {booksCount ?? '...'}</div>
                    <div className="bg-gray-900 p-2 rounded"><strong>Profiles:</strong> {profilesCount ?? '...'}</div>
                </div>
            </section>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">Books Sample (Server)</h2>
                {(!booksSample || booksSample.length === 0) ? (
                    <div className="text-yellow-500">No books found (Empty Array)</div>
                ) : (
                    <ul className="list-disc pl-5">
                        {booksSample.map(b => (
                            <li key={b.id}>
                                <pre className="text-xs text-gray-300 overflow-auto max-w-sm">{JSON.stringify(b, null, 2)}</pre>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* interactive client part (login form, cookie clear) */}
            <DataDebugClient initialUser={user} />
        </div>
    )
}
