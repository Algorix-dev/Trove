"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Eye, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Listing {
    id: string
    title: string
    description: string
    price: number
    category: string
    condition: string
    images: string[]
    location_city: string
    is_featured: boolean
    view_count: number
}

export function ListingCard({ listing }: { listing: Listing }) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group"
        >
            <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-background shadow-lg hover:shadow-primary/20 transition-all duration-500 rounded-3xl h-full flex flex-col">
                <Link href={`/dashboard/marketplace/${listing.id}`} className="relative h-60 w-full bg-muted/30 overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                        <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground/40 bg-secondary/20">
                            <ShoppingBag className="w-12 h-12" />
                        </div>
                    )}

                    {/* Glass Overlay Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        {listing.is_featured && (
                            <Badge className="bg-primary/90 backdrop-blur-md text-white border-none px-3 py-1 rounded-full shadow-lg">
                                Featured 🌟
                            </Badge>
                        )}
                        <Badge variant="secondary" className="bg-background/60 backdrop-blur-md border-none rounded-full px-3 py-1 capitalize">
                            {listing.condition.replace('_', ' ')}
                        </Badge>
                    </div>

                    <div className="absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {listing.view_count || 0}
                        </div>
                    </div>
                </Link>

                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">
                                {listing.title}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                            {listing.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Price</span>
                            <span className="text-2xl font-black text-primary">₦{Number(listing.price).toLocaleString()}</span>
                        </div>

                        {listing.location_city && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                {listing.location_city}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
