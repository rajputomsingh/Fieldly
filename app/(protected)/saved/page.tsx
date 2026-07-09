// app/(protected)/saved/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import { ListingCard } from "@/app/marketplace/_components/ListingCard";
import type { MarketplaceFeedItemDTO } from "@/lib/marketplace/types";

interface SavedListingItem {
  listingId: string;
  listing: MarketplaceFeedItemDTO;
}

export default function SavedListingsPage() {
  const { user, isLoaded } = useUser();

  const [mounted] = useState(() => typeof window !== "undefined");
  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    async function fetchSavedListings() {
      try {
        const res = await fetch("/api/marketplace/saved");
        const data = await res.json();

        if (res.ok) {
          setSavedListings(data.saved || []);
        } else {
          setError(data.error || "Failed to load saved listings");
        }
      } catch {
        setError("Failed to load saved listings");
      } finally {
        setLoading(false);
      }
    }

    fetchSavedListings();
  }, [user, isLoaded]);

  // 1. Prevent hydration mismatch - show loader during SSR
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px] mt-18">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Clerk loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px] mt-18">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Not signed in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-18">
        <Bookmark className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">
          Sign in to view saved listings
        </h2>
        <p className="text-gray-500 mb-4 text-center max-w-md">
          Save your favorite listings and come back to them anytime
        </p>
        <Link
          href="/sign-in"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // 4. API loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] mt-18">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 5. Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-18">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // 6. Empty state
  if (savedListings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-18">
        <Bookmark className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No saved listings</h2>
        <p className="text-gray-500 mb-4 text-center max-w-md">
          Start saving listings you&apos;re interested in to keep track of them
        </p>
        <Link
          href="/marketplace"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  // 7. Success state
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-18">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bookmark className="h-7 w-7 fill-primary text-primary" />
          Saved Listings
        </h1>
        <p className="text-gray-500">
          {savedListings.length}{" "}
          {savedListings.length === 1 ? "listing" : "listings"} saved
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedListings.map((item) => (
          <ListingCard
            key={item.listingId}
            listing={item.listing}
            isSaved={true}
          />
        ))}
      </div>
    </div>
  );
}
