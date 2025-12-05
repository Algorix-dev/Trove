"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState } from "react"

export function LibraryDebugger() {
    const [status, setStatus] = useState("Initializing...")
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        const debugFetch = async () => {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )

                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setStatus("No user found in client auth")
                    return
                }

                setStatus(`User found: ${user.id}. Fetching books...`)

                const { data: books, error: bookError } = await supabase
                    .from('books')
                    .select(`
                        *,
                        reading_progress (
                            current_page,
                            total_pages
                        )
                    `)

                if (bookError) {
                    setError(bookError)
                    setStatus("Error fetching books")
                    console.error("Library Debug Error:", bookError)
                } else {
                    setData(books)
                    setStatus(`Success! Found ${books?.length} books.`)
                    console.log("Library Debug Data:", books)
                }
            } catch (e: any) {
                setError(e.message)
                setStatus("Exception occurred")
            }
        }

        debugFetch()
    }, [])

    return (
        <div className="p-4 my-4 bg-muted/50 rounded-lg border text-xs font-mono">
            <strong>Debug Info:</strong>
            <div>Status: {status}</div>
            {error && <div className="text-red-500">Error: {JSON.stringify(error)}</div>}
            {data && <div>Books Found: {data.length}</div>}
        </div>
    )
}
