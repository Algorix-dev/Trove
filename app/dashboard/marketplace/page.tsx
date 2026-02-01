'use client';

import { Plus, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ListingCard } from '@/components/features/marketplace/listing-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function MarketplacePage() {
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]); // TODO: Define proper Listing type
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadListings();
  }, [selectedCategory]);

  const loadListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('is_sold', false) // Changed from "status", "active"
        .order('is_featured', { ascending: false }) // Changed from "featured"
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['all', 'books', 'manga', 'comics', 'textbooks', 'accessories'];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Trove Marketplace
          </h2>
          <p className="text-muted-foreground text-lg">
            Discovery. Exchange. Knowledge. Join the circular economy.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="rounded-full px-8 shadow-xl hover:shadow-primary/30 transition-all"
        >
          <Link href="/dashboard/marketplace/create">
            <Plus className="w-5 h-5 mr-2" />
            List Item
          </Link>
        </Button>
      </div>

      <div className="bg-card/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search our collection of treasures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-background/50 border-none rounded-2xl focus-visible:ring-primary/20 text-lg"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`capitalize rounded-full px-6 transition-all ${selectedCategory === cat ? 'shadow-lg shadow-primary/30' : 'hover:bg-primary/10'
                }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[400px] bg-muted animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border">
          <div className="bg-primary/10 p-6 rounded-full mb-6 text-primary">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold mb-2">The trove is empty... for now.</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Be the first to share a treasure with the community and earn your first sale badges!
          </p>
          <Button asChild className="mt-8 rounded-full px-8" variant="outline">
            <Link href="/dashboard/marketplace/create">
              <Plus className="w-4 h-4 mr-2" />
              Start Selling
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
