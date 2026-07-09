'use client'

import { useRef, useCallback, useState } from 'react'
import { ListingCard } from './ListingCard'
import { ListingCardGridSkeleton } from './ListingCardSkeleton'
import { Button } from '@/components/ui/button'
import type { MarketplaceFeedItemDTO } from '@/lib/marketplace/types'
import { Loader2, ChevronDown } from 'lucide-react'

interface ListingGridProps {
  listings: MarketplaceFeedItemDTO[]
  savedListings: Set<string>
  onSave: (id: string) => void
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
}

export function ListingGrid({
  listings,
  savedListings,
  onSave,
  onLoadMore,
  hasMore,
  loading
}: ListingGridProps) {
  const observer = useRef<IntersectionObserver | null>(null)
  const [showLoadButton] = useState(() => {
    if (typeof window !== 'undefined') {
      return !('IntersectionObserver' in window)
    }
    return false
  })

  const lastListingRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (showLoadButton) return

    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1
      }
    )

    if (node) observer.current.observe(node)
  }, [loading, hasMore, onLoadMore, showLoadButton])

  if (listings.length === 0 && loading) {
    return <ListingCardGridSkeleton count={6} />
  }

  if (listings.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/30 rounded-full p-4 mb-4">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-muted-foreground mb-2">No listings found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing, index) => {
          const isLast = index === listings.length - 1
          return (
            <div key={listing.id} ref={isLast && !showLoadButton ? lastListingRef : undefined}>
              <ListingCard listing={listing} isSaved={savedListings.has(listing.id)} onSaveAction={() => onSave(listing.id)} />
            </div>
          )
        })}
      </div>

      {loading && listings.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-3 mt-8 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading more listings...</p>
        </div>
      )}

      {!hasMore && listings.length > 0 && !loading && (
        <div className="relative mt-8 py-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground">✨ You&apos;ve reached the end</span>
          </div>
        </div>
      )}

      {(showLoadButton || (!loading && hasMore && listings.length > 0)) && (
        <div className="flex justify-center mt-8">
          <Button onClick={onLoadMore} variant="outline" disabled={loading} className="group min-w-[220px] gap-2 hover:gap-3 transition-all duration-300">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Listings
                <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </>
            )}
          </Button>
        </div>
      )}
    </>
  )
}