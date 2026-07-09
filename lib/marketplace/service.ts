// lib/marketplace/service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { db } from './queries';
import { transformers } from './transformers';
import { marketplaceCache } from './cache';
import { auctionEvents } from './events';
import { logger } from './logger';
import { MARKETPLACE_CONSTANTS } from './constants';
import type {
  BidInput,
  FeedFilters,
  PaginationParams,
} from './validation';
import type {
  // MarketplaceFeedItemDTO,  // Remove this - not directly used
  ListingDetailDTO,
  AuctionDTO,
  BidPlacementResult,
} from './types';

class MarketplaceService {
  /**
   * Get marketplace feed with caching
   */
  async getFeed(filters: FeedFilters, pagination: PaginationParams) {
    const startTime = performance.now();

    // Try cache first
    const cached = await marketplaceCache.getFeed(filters, pagination);
    if (cached) {
      logger.info('Feed cache hit');
      return cached;
    }

    logger.info('Feed cache miss');
    
    // Fetch from database
    const { listings, totalCount } = await db.getFeed(filters, pagination);
    
    // Transform to DTOs
    const transformedListings = listings.map(listing => 
      transformers.transformFeedListing(listing as Record<string, unknown>)
    );

    const result = {
      listings: transformedListings,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / pagination.limit),
      },
    };

    // Cache the result
    await marketplaceCache.setFeed(filters, pagination, result);

    const duration = performance.now() - startTime;
    logger.performance('Feed generated', duration);

    return result;
  }

  /**
   * Get listing detail with caching
   */
  async getListing(listingId: string, userId?: string): Promise<ListingDetailDTO | null> {
    const startTime = performance.now();

    // Try cache first
    const cached = await marketplaceCache.getListing(listingId, userId);
    if (cached) {
      logger.info('Listing cache hit', { listingId });
      return cached as ListingDetailDTO;
    }

    logger.info('Listing cache miss', { listingId });

    // Fetch from database
    const listing = await db.getListing(listingId, userId);
    if (!listing) {
      return null;
    }

    // Transform to DTO
    const transformed = transformers.transformListingDetail(listing as Record<string, unknown>);

    // Cache the result
    await marketplaceCache.setListing(listingId, transformed, userId);

    // Track view asynchronously
    this.trackView(listingId, userId).catch(err => 
      logger.error('View tracking failed', err as Error, { listingId })
    );

    const duration = performance.now() - startTime;
    logger.performance('Listing detail fetched', duration, { listingId });

    return transformed;
  }

  /**
   * Get auction room data with near real-time caching
   */
  async getAuction(listingId: string): Promise<AuctionDTO | null> {
    const startTime = performance.now();

    // Try cache (short TTL for near real-time)
    const cached = await marketplaceCache.getAuction(listingId);
    if (cached) {
      logger.info('Auction cache hit', { listingId });
      return cached as AuctionDTO;
    }

    logger.info('Auction cache miss', { listingId });

    // Fetch from database
    const auctionData = await db.getAuction(listingId);
    if (!auctionData) {
      return null;
    }

    // Transform to DTO
    const transformed = transformers.transformAuction(auctionData as Record<string, unknown>);

    // Cache briefly
    await marketplaceCache.setAuction(listingId, transformed);

    const duration = performance.now() - startTime;
    logger.performance('Auction data fetched', duration, { listingId });

    return transformed;
  }

  /**
   * Place a bid with atomic transaction
   */
  async placeBid(
    listingId: string,
    bidInput: BidInput
  ): Promise<BidPlacementResult> {
    const startTime = performance.now();
    const { farmerId, amount, isAutoBid = false } = bidInput;

    // Fetch listing with current highest bid
    const listing = await prisma.landListing.findUnique({
      where: { 
        id: listingId,
        status: 'ACTIVE',
        listingType: 'OPEN_BIDDING',
      },
      include: {
        bids: {
          where: { status: 'ACTIVE' },
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    });

    // Validation
    if (!listing) {
      throw new Error('Listing not available for bidding');
    }

    const now = new Date();
    const startDate = new Date(listing.startDate);
    const endDate = new Date(listing.endDate);
    
    if (now < startDate) {
      throw new Error('Auction has not started yet');
    }
    if (now > endDate) {
      throw new Error('Auction has ended');
    }

    const highestBid = listing.bids[0]?.amount || listing.basePrice;
    const minBid = highestBid + (listing.bidIncrement || MARKETPLACE_CONSTANTS.BID.DEFAULT_INCREMENT);

    if (amount < minBid) {
      throw new Error(`Bid must be at least ₹${minBid}`);
    }

    // Execute atomic transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Get next sequence
        const lastBid = await tx.bid.findFirst({
          where: { listingId },
          orderBy: { sequence: 'desc' },
        });
        const sequence = (lastBid?.sequence || 0) + 1;

        // Create new bid
        const bid = await tx.bid.create({
          data: {
            listingId,
            farmerId,
            amount,
            sequence,
            isAutoBid,
            status: 'ACTIVE',
            isWinning: true,
          },
        });

        // Outbid previous highest bid
        if (listing.bids[0]) {
          await tx.bid.update({
            where: { id: listing.bids[0].id },
            data: {
              status: 'OUTBID',
              outbidAt: new Date(),
              isWinning: false,
            },
          });
        }

        // Update listing
        const updateData: Prisma.LandListingUpdateInput = {
          totalBids: { increment: 1 },
          highestBid: amount,
          currentLeaderId: farmerId,
          lastBidAt: new Date(),
          winningBid: {
            connect: { id: bid.id },
          },
        };

        // Auto-extend if within last 5 minutes
        let extended = false;
        const timeLeft = endDate.getTime() - Date.now();
        if (timeLeft < MARKETPLACE_CONSTANTS.BID.AUTO_EXTEND_WINDOW && listing.autoExtendMinutes) {
          const newEndDate = new Date(Date.now() + listing.autoExtendMinutes * 60 * 1000);
          updateData.endDate = newEndDate;
          extended = true;
        }

        await tx.landListing.update({
          where: { id: listingId },
          data: updateData,
        });

        // Create auction event
        await tx.auctionEvent.create({
          data: {
            listingId,
            type: 'BID_PLACED',
            actorId: farmerId,
            bidId: bid.id,
            metadata: { amount, sequence, autoExtended: extended },
          },
        });

        // Update analytics
        await tx.listingAnalytics.upsert({
          where: { listingId },
          update: {
            bidVelocity: { increment: 1 },
            lastActivityAt: new Date(),
          },
          create: {
            listingId,
            bidVelocity: 1,
            lastActivityAt: new Date(),
          },
        });

        return { bid, extended };
      },
      {
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // Invalidate caches
    await Promise.all([
      marketplaceCache.invalidateListing(listingId),
      marketplaceCache.invalidateAuction(listingId),
      marketplaceCache.invalidateFeed(),
    ]);

    // Trigger realtime events
    await auctionEvents.emitNewBid(listingId, {
      id: result.bid.id,
      amount: result.bid.amount,
      farmerId: result.bid.farmerId,
      createdAt: result.bid.createdAt,
    });
    
    if (result.extended) {
      await auctionEvents.emitAuctionExtended(
        listingId,
        new Date(Date.now() + (listing.autoExtendMinutes || 5) * 60 * 1000),
        listing.autoExtendMinutes || 5
      );
    }

    const duration = performance.now() - startTime;
    logger.performance('Bid placed successfully', duration, { listingId, amount });

    return {
      success: true,
      bid: transformers.transformBid(result.bid as Record<string, unknown>),
      extended: result.extended,
      timing: { durationMs: duration },
    };
  }

  /**
   * Get saved listings
   */
  async getSavedListings(userId: string) {
    const savedListings = await db.getSavedListings(userId);
    
    return {
      saved: savedListings,
      count: savedListings.length,
    };
  }

  /**
   * Save a listing
   */
  async saveListing(userId: string, listingId: string) {
    // Check if listing exists
    const listing = await prisma.landListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    try {
      const saved = await prisma.savedListing.create({
        data: { listingId, userId },
      });

      // Invalidate relevant caches
      await marketplaceCache.invalidateListing(listingId);

      return { saved, message: 'Listing saved successfully' };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2002') {
        return { message: 'Listing already saved' };
      }
      throw error;
    }
  }

  /**
   * Unsave a listing
   */
  async unsaveListing(userId: string, listingId: string) {
    try {
      await prisma.savedListing.delete({
        where: {
          listingId_userId: { listingId, userId },
        },
      });

      // Invalidate relevant caches
      await marketplaceCache.invalidateListing(listingId);

      return { message: 'Listing removed from saved' };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2025') {
        return { message: 'Listing was not saved' };
      }
      throw error;
    }
  }

  /**
   * Get recommendations
   */
  async getRecommendations(userId: string) {
    return db.getRecommendations(userId);
  }

  /**
   * Get trending listings
   */
  async getTrending() {
    return db.getTrending();
  }

  /**
   * Track listing view
   */
  private async trackView(listingId: string, userId?: string): Promise<void> {
    const shouldTrack = await marketplaceCache.trackView(listingId, userId);
    if (shouldTrack) {
      await db.trackView(listingId);
    }
  }
}

// Export singleton
export const marketplaceService = new MarketplaceService();