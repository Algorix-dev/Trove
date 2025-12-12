"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ClientDebug() {
    const [cookies, setCookies] = useState<string>("")
    const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({})
    const [sessionStatus, setSessionStatus] = useState<string>("Checking...")

    // Login Test State
    const [testEmail, setTestEmail] = useState("")
    const [testPassword, setTestPassword] = useState("")
    const [testResult, setTestResult] = useState<any>(null)

    useEffect(() => {
        // 1. Read Cookies
        setCookies(document.cookie)

        // 2. Read LocalStorage (Supabase sometimes falls back to this)
        const items: Record<string, string> = {}
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key) items[key] = localStorage.getItem(key) || ""
        }
        setLocalStorageItems(items)

        // 3. Check Supabase Session Client-Side
        const checkSession = async () => {
            const supabase = createBrowserSupabaseClient()
            const { data } = await supabase.auth.getSession()
            setSessionStatus(data.session ? "ACTIVE ✅" : "NULL ❌")
        }
        checkSession()
    }, [])

    return (
        <section className="space-y-4 border p-4 rounded border-blue-800 mt-8">
            <h2 className="text-xl font-bold text-white">4. CLIENT-SIDE INSPECTOR (Browser)</h2>

            <div className="space-y-2">
                <h3 className="font-bold text-blue-400">Document.cookie (Raw String):</h3>
                <div className="bg-black p-3 rounded break-all font-mono text-xs">
                    {cookies || "EMPTY STRING (No cookies accessible to JS)"}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-blue-400">LocalStorage Keys:</h3>
                <ul className="list-disc pl-5">
                    {Object.keys(localStorageItems).length === 0 ? (
                        <li>Empty</li>
                    ) : (
                        Object.keys(localStorageItems).map(k => (
                            <li key={k}>{k}</li>
                        ))
                    )}
                </ul>
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-blue-400">Client-Side Supabase Status:</h3>
                <div className="bg-black p-2 rounded font-mono">
                    {sessionStatus}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-blue-900">
                <h3 className="font-bold text-white">Manual Login Tester</h3>
                <div className="grid gap-2 max-w-sm">
                    <Input
                        placeholder="Email"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        className="bg-neutral-800 border-neutral-700"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={testPassword}
                        onChange={e => setTestPassword(e.target.value)}
                        className="bg-neutral-800 border-neutral-700"
                    />
                    <Button
                        onClick={async () => {
                            setTestResult("Logging in...")
                            const supabase = createBrowserSupabaseClient()
                            const { data, error } = await supabase.auth.signInWithPassword({
                                email: testEmail,
                                password: testPassword
                            })
                            setTestResult({ data, error })

                            // Refresh cookie view
                            setCookies(document.cookie)
                            const { data: sess } = await supabase.auth.getSession()
                            setSessionStatus(sess.session ? "ACTIVE ✅ (Just Logged In)" : "NULL ❌")
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Test Sign In
                    </Button>
                </div>
                {testResult && (
                    <pre className="p-2 bg-black rounded text-xs overflow-auto">
                        {JSON.stringify(testResult, null, 2)}
                    </pre>
                )}
            </div>
        </section>
    )
}
