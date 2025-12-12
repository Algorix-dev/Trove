// components/debug/data-debug-client.tsx
"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DataDebugClient({ initialUser }: { initialUser: any | null }) {
    const [rawCookies, setRawCookies] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loginResult, setLoginResult] = useState<any>(null)

    useEffect(() => {
        setRawCookies(typeof document !== "undefined" ? document.cookie : "")
    }, [])

    return (
        <section className="space-y-4 border border-blue-800 p-4 rounded bg-blue-950/20">
            <h2 className="text-xl text-white font-bold">Client Interactive Tests</h2>

            <div>
                <strong>Client Raw Cookies:</strong>
                <div className="bg-gray-900 p-2 rounded break-all text-xs text-gray-400">{rawCookies || "EMPTY / NONE DETECTED"}</div>
            </div>

            <div className="flex gap-2 items-start">
                <Input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button onClick={async () => {
                    const supabase = createBrowserSupabaseClient()
                    setLoginResult("Logging in...")
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                    setLoginResult({ data, error })
                    setRawCookies(document.cookie)
                    if (!error) window.location.reload()
                }}>Force Login</Button>
            </div>

            <div>
                <Button variant="destructive" onClick={() => {
                    const cookies = document.cookie.split(";");
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i];
                        const eqPos = cookie.indexOf("=");
                        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                        document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                    }
                    window.location.reload();
                }}>Clear Client Cookies</Button>
            </div>

            <pre className="bg-black p-2 rounded text-xs text-blue-300">{JSON.stringify({ initialUser, loginResult }, null, 2)}</pre>
        </section>
    )
}
