// app/dashboard/marketplace/page.tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, DollarSign, MessageCircle, Search, TrendingUp } from "lucide-react"

interface BookListing {
    id: string
    title: string
    author: string
    price: number
    condition: string
    seller: string
    image: string
}

const mockListings: BookListing[] = [
    {
        id: "1",
        title: "The Midnight Library",
        author: "Matt Haig",
        price: 12.99,
        condition: "Like New",
        seller: "Sarah M.",
        image: "gradient:linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
        id: "2",
        title: "Project Hail Mary",
        author: "Andy Weir",
        price: 15.50,
        condition: "Good",
        seller: "John D.",
        image: "gradient:linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
        id: "3",
        title: "Atomic Habits",
        author: "James Clear",
        price: 10.00,
        condition: "Very Good",
        seller: "Emma W.",
        image: "gradient:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    }
]

export default function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState("")

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <ShoppingBag className="h-8 w-8 text-green-500" />
                        Book Marketplace
                    </h1>
                    <p className="text-muted-foreground">Buy and sell books with fellow readers</p>
                </div>
                <Button className="bg-green-500 hover:bg-green-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    List a Book
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">234</p>
                            <p className="text-xs text-muted-foreground">Active Listings</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">89</p>
                            <p className="text-xs text-muted-foreground">Sold This Week</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">156</p>
                            <p className="text-xs text-muted-foreground">Active Buyers</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Discord Integration Notice */}
            <Card className="p-4 bg-indigo-500/10 border-indigo-500/20">
                <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Connect on Discord</p>
                        <p className="text-sm text-muted-foreground">
                            Join our Discord server to chat with sellers, arrange meetups, and discuss books!
                            All transactions are coordinated through our community.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                            <a href="https://discord.gg/trove-readers" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-3 w-3 mr-2" />
                                Join Discord
                            </a>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Listings */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockListings.map((listing) => (
                    <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div
                            className="h-48 w-full"
                            style={{ background: listing.image.replace('gradient:', '') }}
                        />
                        <div className="p-4">
                            <h3 className="font-semibold mb-1">{listing.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{listing.author}</p>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-2xl font-bold text-green-600">${listing.price}</p>
                                <Badge variant="secondary">{listing.condition}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                                <span>{listing.seller}</span>
                            </div>
                            <Button className="w-full" variant="outline">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Contact Seller
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* How It Works */}
            <Card className="p-6">
                <h3 className="font-semibold mb-4">How It Works</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold mb-2">1</div>
                        <p className="font-medium mb-1">List Your Book</p>
                        <p className="text-sm text-muted-foreground">Post books you want to sell with price and condition</p>
                    </div>
                    <div>
                        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mb-2">2</div>
                        <p className="font-medium mb-1">Connect on Discord</p>
                        <p className="text-sm text-muted-foreground">Chat with buyers/sellers and arrange meetups</p>
                    </div>
                    <div>
                        <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mb-2">3</div>
                        <p className="font-medium mb-1">Complete Transaction</p>
                        <p className="text-sm text-muted-foreground">Meet safely and exchange books for cash</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
