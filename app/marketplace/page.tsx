// app/(marketplace)/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ListingGrid } from "./_components/ListingGrid";
import {
  ListingFiltersSidebar,
  ActiveFilters,
  MarketplaceHeader,
} from "./_components/ListingFiltersSidebar";
import { ListingCardGridSkeleton } from "./_components/ListingCardSkeleton";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { FeedFilters } from "@/lib/marketplace/validation";

function MarketplacePageSkeleton() {
  return (
    <div className="space-y-6 mt-18 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-5 w-80 bg-gray-200 rounded-md mt-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 flex-1 min-w-[200px] sm:min-w-[250px] md:w-80 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-[140px] sm:w-[180px] bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse lg:hidden" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="flex gap-6 lg:gap-8">
        <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="h-7 w-20 bg-gray-200 rounded-md animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="h-px w-full bg-gray-200" />
            <div className="space-y-4">
              <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="h-px w-full bg-gray-200" />
            <div className="space-y-4">
              <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <ListingCardGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Force client-only rendering after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    listings,
    loading,
    error,
    hasMore,
    filters,
    setFilters,
    loadMore,
    toggleSave,
    savedListings,
  } = useMarketplace();

  const clearAllFilters = () => {
    setFilters({ sortBy: filters.sortBy });
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete (newFilters as Record<string, unknown>)[key];
    setFilters(newFilters as FeedFilters);
  };

  if (!isClient) {
    return <MarketplacePageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-18">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Show loading skeleton while fetching initial data
  if (loading && listings.length === 0) {
    return <MarketplacePageSkeleton />;
  }

  return (
    <div
      className="space-y-6 mt-18 px-4 sm:px-6 lg:px-8"
      suppressHydrationWarning
    >
      <MarketplaceHeader
        filters={filters}
        onFiltersChange={setFilters}
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={setMobileFiltersOpen}
      />

      <ActiveFilters
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearAll={clearAllFilters}
        formatNumber={formatNumber}
      />

      <div className="flex gap-6 lg:gap-8">
        <ListingFiltersSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1 min-w-0">
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No listings found</p>
              <Button variant="link" onClick={clearAllFilters} className="mt-2">
                Clear filters
              </Button>
            </div>
          ) : (
            <ListingGrid
              listings={listings}
              savedListings={savedListings}
              onSave={toggleSave}
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
