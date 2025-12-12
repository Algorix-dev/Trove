"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Loader2 } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

function VerifyContent() {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email")

    const supabase = createBrowserSupabaseClient()

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            toast.error("Email not found. Please try logging in again.")
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'email',
            })

            if (error) throw error

            toast.success("Successfully verified!")
            router.push("/dashboard")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Invalid verification code")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center gap-2">
                    <BookOpen className="h-12 w-12 text-primary" />
                    <h1 className="text-3xl font-bold">Check your email</h1>
                    <p className="text-muted-foreground text-center">
                        We sent a verification code to <span className="font-semibold text-foreground">{email}</span>
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleVerify}>
                        <CardHeader>
                            <CardTitle>Enter Code</CardTitle>
                            <CardDescription>
                                Enter the 6-digit code sent to your email to verify your identity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className="text-center text-2xl tracking-widest"
                                    maxLength={6}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" type="submit" disabled={loading || code.length < 6}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Code"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => router.push("/login")}
                            >
                                Back to Login
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    )
}

