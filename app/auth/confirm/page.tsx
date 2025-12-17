"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function ConfirmEmailContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()

    const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )

    useEffect(() => {
        const confirmEmail = async () => {
            const token_hash = searchParams.get('token_hash')
            const type = searchParams.get('type')

            if (!token_hash || type !== 'email') {
                setStatus('error')
                setMessage('Invalid confirmation link. Please try signing up again.')
                return
            }

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash,
                    type: 'email'
                })

                if (error) throw error

                setStatus('success')
                setMessage('Your email has been confirmed! Redirecting to dashboard...')

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    router.push('/dashboard')
                }, 2000)
            } catch (error: any) {
                setStatus('error')
                setMessage(error.message || 'Failed to confirm email. Please try again.')
            }
        }

        confirmEmail()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center gap-2">
                    <BookOpen className="h-12 w-12 text-primary" />
                    <h1 className="text-3xl font-bold">Trove</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {status === 'loading' && (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    Confirming Email...
                                </>
                            )}
                            {status === 'success' && (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    Email Confirmed!
                                </>
                            )}
                            {status === 'error' && (
                                <>
                                    <XCircle className="h-5 w-5 text-destructive" />
                                    Confirmation Failed
                                </>
                            )}
                        </CardTitle>
                        <CardDescription>{message}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {status === 'success' && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Welcome to Trove! You can now access your reading library and start your journey.
                                </p>
                                <Button className="w-full" asChild>
                                    <Link href="/dashboard">Go to Dashboard</Link>
                                </Button>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    If you continue to have issues, please try signing up again or contact support.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href="/signup">Sign Up Again</Link>
                                    </Button>
                                    <Button className="flex-1" asChild>
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                        {status === 'loading' && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ConfirmEmailContent />
        </Suspense>
    )
}
