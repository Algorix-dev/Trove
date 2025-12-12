"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export function ClientDebug() {
    const [cookies, setCookies] = useState<string>("")
    const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({})
    const [sessionStatus, setSessionStatus] = useState<string>("Checking...")

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
        </section>
    )
}
