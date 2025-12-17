"use client"

import { useEffect, useState } from "react"
import { Quote } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

// Curated inspirational reading quotes
const DEFAULT_QUOTES = [
    { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
    { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
    { text: "The reading of all good books is like conversation with the finest minds.", author: "René Descartes" },
    { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
    { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley" },
    { text: "Books are the quietest and most constant of friends.", author: "Charles W. Eliot" },
    { text: "The journey of a lifetime starts with the turning of a page.", author: "Rachel Anders" },
]

interface QuoteData {
    text: string
    author: string
}

export function DashboardQuote() {
    const [quote, setQuote] = useState<QuoteData>(DEFAULT_QUOTES[0])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadQuote = async () => {
            const supabase = createBrowserClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
            )

            try {
                // Try to get a random quote from user's saved quotes first
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: userQuotes } = await supabase
                        .from('book_quotes')
                        .select('quote_text, books(title)')
                        .eq('user_id', user.id)
                        .limit(50)

                    if (userQuotes && userQuotes.length > 0) {
                        // Mix user quotes with default quotes
                        const allQuotes = [
                            ...userQuotes.map(q => ({
                                text: q.quote_text,
                                author: (q.books as any)?.title || "Your Library"
                            })),
                            ...DEFAULT_QUOTES
                        ]
                        const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)]
                        setQuote(randomQuote)
                        setLoading(false)
                        return
                    }
                }
            } catch (error) {
                console.error('Error loading quotes:', error)
            }

            // Fallback to default quotes
            const randomIndex = Math.floor(Math.random() * DEFAULT_QUOTES.length)
            setQuote(DEFAULT_QUOTES[randomIndex])
            setLoading(false)
        }

        loadQuote()

        // Rotate quote every 30 seconds
        const interval = setInterval(() => {
            loadQuote()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="text-sm text-muted-foreground italic bg-muted/50 px-4 py-2 rounded-full hidden md:block animate-pulse">
                Loading inspiration...
            </div>
        )
    }

    return (
        <div className="text-sm text-muted-foreground italic bg-muted/50 px-4 py-2 rounded-full hidden md:block transition-all duration-500 animate-in fade-in">
            <Quote className="inline h-3 w-3 mr-1.5" />
            "{quote.text}" — {quote.author}
        </div>
    )
}

