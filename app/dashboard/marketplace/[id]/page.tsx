"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Eye, MessageSquare, Calendar, ShoppingBag } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { PaystackButton } from "@/components/features/marketplace/paystack-button"

export default function MarketplaceListingPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (params["id"]) {
      loadListing()
    }
    checkUser()
  }, [params["id"]])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadListing = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select(`
          *,
          profiles:seller_id (
            full_name,
            nickname,
            email,
            avatar_url
          )
        `)
        .eq("id", params["id"])
        .single()

      if (error) throw error

      if (data) {
        await supabase
          .from("marketplace_listings")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", params["id"])
      }

      setListing(data)
    } catch (error: any) {
      console.error("Error loading listing:", error)
      toast.error("Failed to load listing")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (reference: string) => {
    // Record transaction
    const { error } = await supabase.from("marketplace_transactions").insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      amount: listing.price,
      payment_reference: reference,
      status: 'paid'
    })

    if (!error) {
      toast.success("Payment successful! The seller has been notified.")
      loadListing() // Refresh status
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto py-10">
        <div className="h-[500px] bg-muted animate-pulse rounded-[3rem]" />
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-lg w-1/3" />
          <div className="h-6 bg-muted animate-pulse rounded-lg w-1/2" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-20">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
          <p className="text-2xl font-bold text-muted-foreground">This treasure has vanished.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full group hover:bg-primary/10 pl-2">
          <div className="bg-background shadow-md rounded-full p-2 mr-3 group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-semibold">Explore Marketplace</span>
        </Button>
        <div className="flex gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <Calendar className="w-4 h-4" />
          Listed on {new Date(listing.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-12 items-start">
        {/* Gallery Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative h-[600px] w-full bg-muted/30 rounded-[3rem] overflow-hidden shadow-2xl group border-8 border-background">
            {listing.images && listing.images.length > 0 ? (
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                <ShoppingBag className="w-24 h-24 mb-4" />
                <p className="text-xl font-medium">No Visuals Available</p>
              </div>
            )}

            <div className="absolute top-8 left-8 flex gap-3">
              {listing.is_featured && (
                <Badge className="bg-primary/80 backdrop-blur-xl text-white text-md px-6 py-2 rounded-full shadow-2xl border-none">
                  Featured 🌟
                </Badge>
              )}
            </div>

            <div className="absolute bottom-8 right-8">
              <div className="bg-black/60 backdrop-blur-xl text-white px-6 py-3 rounded-2xl flex items-center gap-2 border border-white/20">
                <Eye className="w-5 h-5 text-primary-foreground" />
                <span className="font-bold">{listing.view_count || 0}</span>
                <span className="text-xs opacity-70 border-l border-white/20 pl-2">Interactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.2em]">
              <span className="text-primary">{listing.category}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{listing.condition?.replace('_', ' ')}</span>
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-tighter">{listing.title}</h1>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Acquisition Price</span>
                <span className="text-6xl font-black text-primary drop-shadow-sm">₦{Number(listing.price).toLocaleString()}</span>
              </div>
              {listing.location_city && (
                <div className="mt-8 flex items-center gap-2 text-sm font-bold bg-muted px-5 py-2.5 rounded-2xl">
                  <MapPin className="w-4 h-4 text-primary" />
                  {listing.location_city}, {listing.location_state}
                </div>
              )}
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed italic bg-muted/30 p-8 rounded-[2rem] border-l-4 border-primary">
            "{listing.description || "The owner left no lore for this item."}"
          </p>

          <div className="pt-6 space-y-4">
            {user?.id === listing.seller_id ? (
              <Button variant="outline" size="lg" className="w-full h-16 rounded-2xl text-lg font-bold border-2 border-dashed" disabled>
                This listing belongs to you
              </Button>
            ) : listing.is_sold ? (
              <Button variant="outline" size="lg" className="w-full h-16 rounded-2xl text-lg font-bold border-destructive text-destructive" disabled>
                SOLD OUT
              </Button>
            ) : user ? (
              <div className="space-y-4">
                <PaystackButton
                  email={user.email}
                  amount={listing.price}
                  metadata={{ listing_id: listing.id }}
                  onSuccess={handlePaymentSuccess}
                  onClose={() => { }}
                />
                <Button variant="secondary" className="w-full h-16 rounded-2xl text-lg font-bold shadow-sm" onClick={() => toast.info("Messaging feature coming soon!")}>
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Inquire with Seller
                </Button>
              </div>
            ) : (
              <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-bold" onClick={() => router.push('/login')}>
                Sign in to Purchase
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground font-medium">✨ Secured with Paystack. Instant seller notification.</p>
          </div>

          {/* Seller Profile Card */}
          <div className="pt-10">
            <div className="bg-gradient-to-br from-card to-secondary/20 p-8 rounded-[2.5rem] border border-border/50 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShoppingBag className="w-32 h-32 -mr-10 -mt-10" />
              </div>
              <div className="relative flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-4 border-background transform -rotate-3 group-hover:rotate-0 transition-transform">
                  {listing.profiles?.avatar_url ? (
                    <Image
                      src={listing.profiles.avatar_url}
                      alt={listing.profiles.nickname || "Seller"}
                      width={80}
                      height={80}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <div className="bg-primary h-full w-full flex items-center justify-center text-white text-3xl font-black">
                      {listing.profiles?.nickname?.[0]?.toUpperCase() || "S"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Authenticated Merchant</h4>
                  <p className="text-2xl font-black">{listing.profiles?.nickname || listing.profiles?.full_name || "Anonymous Member"}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">Top Seller 🎖️</span>
                    <span className="text-xs font-semibold px-3 py-1 bg-muted rounded-full">Joined {new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


