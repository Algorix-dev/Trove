"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DataDebugPage() {
    const [status, setStatus] = useState("Loading...")
    const [userData, setUserData] = useState<any>(null)
    const [tableCounts, setTableCounts] = useState<any>({})
    const [booksSample, setBooksSample] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [rawCookies, setRawCookies] = useState<string>("")

    // Login State
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loginResult, setLoginResult] = useState<any>(null)

    useEffect(() => {
        setRawCookies(document.cookie)

        const runDiagnostics = async () => {
            try {
                const supabase = createBrowserSupabaseClient()

                // 1. Check Auth
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError) throw authError

                if (!user) {
                    setStatus("User is NULL (Not Logged In)")
                    return
                }
                setUserData({ id: user.id, email: user.email })

                // 2. Check Row Level Security (RLS) - Count
                const { count: booksCount, error: booksError } = await supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true })

                const { count: profilesCount, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })

                if (booksError) console.error("Books Error:", booksError)
                if (profilesError) console.error("Profiles Error:", profilesError)

                setTableCounts({
                    books: booksCount,
                    profiles: profilesCount,
                    booksError: booksError?.message,
                    profilesError: profilesError?.message
                })

                // 3. Fetch Actual Data
                const { data: books, error: fetchError } = await supabase
                    .from('books')
                    .select('id, title, user_id')
                    .limit(5)

                if (fetchError) throw fetchError
                setBooksSample(books || [])

                setStatus("Complete")
            } catch (err: any) {
                console.error("Diagnostic Error:", err)
                setError(err.message)
                setStatus("Failed")
            }
        }

        runDiagnostics()
    }, [])

    return (
        <div className="p-8 bg-black min-h-screen text-green-400 font-mono text-sm space-y-6">
            <h1 className="text-2xl text-white font-bold">DATA ACCESS DIAGNOSTIC</h1>

            <div className={`p-4 rounded border ${status === 'Complete' ? 'border-green-800 bg-green-950/30' : 'border-red-800 bg-red-950/30'}`}>
                <strong>Status:</strong> {status} <br />
                {error && <span className="text-red-500">Error: {error}</span>}
            </div>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">0. Raw Cookies (Client-Side)</h2>
                <div className="bg-gray-900 p-2 rounded break-all text-xs text-gray-400">
                    {rawCookies || "EMPTY / NONE DETECTED"}
                </div>
            </section>

            </section>

            <section className="space-y-4 border border-blue-800 p-4 rounded bg-blue-950/20">
                <h2 className="text-xl text-white font-bold">4. Manual Login Test</h2>
                <div className="flex flex-col gap-2 max-w-sm">
                    <Input 
                        placeholder="Email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="bg-neutral-800 border-neutral-700 text-white"
                    />
                    <Input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="bg-neutral-800 border-neutral-700 text-white"
                    />
                    <Button 
                        onClick={async () => {
                            try {
                                setLoginResult("Logging in...")
                                const supabase = createBrowserSupabaseClient()
                                const { data, error } = await supabase.auth.signInWithPassword({
                                    email,
                                    password
                                })
                                setLoginResult({ success: !error, error, user: data.user?.id })
                                
                                // Update Cookies View immediately
                                setRawCookies(document.cookie)
                                
                                // Re-run diagnostics
                                if (!error) {
                                    window.location.reload()
                                }
                            } catch (e: any) {
                                setLoginResult({ error: e.message })
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Force Login & Reload
                    </Button>
                </div>
                {loginResult && (
                    <pre className="bg-black p-2 rounded text-xs text-blue-300">
                        {JSON.stringify(loginResult, null, 2)}
                    </pre>
                )}
            </section>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">1. Auth User</h2>
                <pre className="bg-gray-900 p-2 rounded overflow-auto">
                    {JSON.stringify(userData, null, 2) || "NULL"}
                </pre>
            </section>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">2. RLS Table Counts</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-2 rounded">
                        <strong>My Books:</strong> {tableCounts.books ?? '...'}
                        {tableCounts.booksError && <div className="text-red-500">{tableCounts.booksError}</div>}
                    </div>
                    <div className="bg-gray-900 p-2 rounded">
                        <strong>My Profile:</strong> {tableCounts.profiles ?? '...'}
                        {tableCounts.profilesError && <div className="text-red-500">{tableCounts.profilesError}</div>}
                    </div>
                </div>
            </section>

            <section className="space-y-2 border border-gray-800 p-4 rounded">
                <h2 className="text-xl text-white">3. Data Sample (Books)</h2>
                {booksSample.length === 0 ? (
                    <div className="text-yellow-500">No books found (Empty Array)</div>
                ) : (
                    <ul className="list-disc pl-5">
                        {booksSample.map(b => (
                            <li key={b.id}>
                                <span className="text-white">{b.title}</span> (User: {b.user_id})
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div >
    )
}
