// lib/marketplace/service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { db } from './queries';
import { transformers } from './transformers';
import { marketplaceCache } from './cache';
import { auctionEvents } from './events';
import { logger } from './logger';
import { MARKETPLACE_CONSTANTS } from './constants';
import type { BidInput, FeedFilters, PaginationParams } from './validation';
import type { ListingDetailDTO, AuctionDTO, BidPlacementResult } from './types';

class MarketplaceService {
  // ============================================================
  // PHASE 1: Performance measurement helper
  // ============================================================
  private async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const ms = Math.round(performance.now() - start);
      logger.performance(name, ms);
      if (ms > 3000) {
        logger.warn(`SLOW: ${name}`, { durationMs: ms });
      }
      return result;
    } catch (error) {
      const ms = Math.round(performance.now() - start);
      logger.error(`${name} failed after ${ms}ms`, error as Error);
      throw error;
    }
  }

  // ============================================================
  // Feed
  // ============================================================
  async getFeed(filters: FeedFilters, pagination: PaginationParams) {
    return this.measure('getFeed', async () => {
      const cached = await marketplaceCache.getFeed(filters, pagination);
      if (cached) {
        logger.info('Feed cache hit');
        return cached;
      }

      logger.info('Feed cache miss');

      const { listings, totalCount } = await db.getFeed(filters, pagination);

      const transformedListings = listings.map((listing) =>
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

      await marketplaceCache.setFeed(filters, pagination, result);
      return result;
    });
  }

  // ============================================================
  // Listing Detail
  // ============================================================
  async getListing(listingId: string, userId?: string): Promise<ListingDetailDTO | null> {
    return this.measure('getListing', async () => {
      const cached = await marketplaceCache.getListing(listingId, userId);
      if (cached) {
        logger.info('Listing cache hit', { listingId });
        return cached as ListingDetailDTO;
      }

      logger.info('Listing cache miss', { listingId });

      const listing = await db.getListing(listingId, userId);
      if (!listing) return null;

      const transformed = transformers.transformListingDetail(listing as Record<string, unknown>);
      await marketplaceCache.setListing(listingId, transformed, userId);

      this.trackView(listingId, userId).catch((err) =>
        logger.error('View tracking failed', err as Error, { listingId })
      );

      return transformed;
    });
  }

  // ============================================================
  // Auction Room
  // ============================================================
  async getAuction(listingId: string): Promise<AuctionDTO | null> {
    return this.measure('getAuction', async () => {
      const cached = await marketplaceCache.getAuction(listingId);
      if (cached) {
        logger.info('Auction cache hit', { listingId });
        return cached as AuctionDTO;
      }

      logger.info('Auction cache miss', { listingId });

      const auctionData = await db.getAuction(listingId);
      if (!auctionData) return null;

      const transformed = transformers.transformAuction(auctionData as Record<string, unknown>);
      await marketplaceCache.setAuction(listingId, transformed);

      return transformed;
    });
  }

  // ============================================================
  // Place Bid
  // ============================================================
  async placeBid(listingId: string, bidInput: BidInput): Promise<BidPlacementResult> {
    return this.measure('placeBid', async () => {
      const { farmerId, amount, isAutoBid = false } = bidInput;

      const listing = await prisma.landListing.findUnique({
        where: { id: listingId, status: 'ACTIVE', listingType: 'OPEN_BIDDING' },
        include: { bids: { where: { status: 'ACTIVE' }, orderBy: { amount: 'desc' }, take: 1 } },
      });

      if (!listing) throw new Error('Listing not available for bidding');

      const now = new Date();
      const startDate = new Date(listing.startDate);
      const endDate = new Date(listing.endDate);

      if (now < startDate) throw new Error('Auction has not started yet');
      if (now > endDate) throw new Error('Auction has ended');

      const highestBid = listing.bids[0]?.amount || listing.basePrice;
      const minBid = highestBid + (listing.bidIncrement || MARKETPLACE_CONSTANTS.BID.DEFAULT_INCREMENT);
      if (amount < minBid) throw new Error(`Bid must be at least ₹${minBid}`);

      const result = await prisma.$transaction(
        async (tx) => {
          const lastBid = await tx.bid.findFirst({ where: { listingId }, orderBy: { sequence: 'desc' } });
          const sequence = (lastBid?.sequence || 0) + 1;

          const bid = await tx.bid.create({
            data: { listingId, farmerId, amount, sequence, isAutoBid, status: 'ACTIVE', isWinning: true },
          });

          if (listing.bids[0]) {
            await tx.bid.update({
              where: { id: listing.bids[0].id },
              data: { status: 'OUTBID', outbidAt: new Date(), isWinning: false },
            });
          }

          const updateData: Prisma.LandListingUpdateInput = {
            totalBids: { increment: 1 },
            highestBid: amount,
            currentLeaderId: farmerId,
            lastBidAt: new Date(),
            winningBid: { connect: { id: bid.id } },
          };

          let extended = false;
          const timeLeft = endDate.getTime() - Date.now();
          if (timeLeft < MARKETPLACE_CONSTANTS.BID.AUTO_EXTEND_WINDOW && listing.autoExtendMinutes) {
            updateData.endDate = new Date(Date.now() + listing.autoExtendMinutes * 60 * 1000);
            extended = true;
          }

          await tx.landListing.update({ where: { id: listingId }, data: updateData });

          await tx.auctionEvent.create({
            data: { listingId, type: 'BID_PLACED', actorId: farmerId, bidId: bid.id, metadata: { amount, sequence, autoExtended: extended } },
          });

          await tx.listingAnalytics.upsert({
            where: { listingId },
            update: { bidVelocity: { increment: 1 }, lastActivityAt: new Date() },
            create: { listingId, bidVelocity: 1, lastActivityAt: new Date() },
          });

          return { bid, extended };
        },
        { timeout: 10000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      await Promise.all([
        marketplaceCache.invalidateListing(listingId),
        marketplaceCache.invalidateAuction(listingId),
        marketplaceCache.invalidateFeed(),
      ]);

      await auctionEvents.emitNewBid(listingId, {
        id: result.bid.id, amount: result.bid.amount, farmerId: result.bid.farmerId, createdAt: result.bid.createdAt,
      });

      if (result.extended) {
        await auctionEvents.emitAuctionExtended(listingId, new Date(Date.now() + (listing.autoExtendMinutes || 5) * 60 * 1000), listing.autoExtendMinutes || 5);
      }

      return {
        success: true,
        bid: transformers.transformBid(result.bid as Record<string, unknown>),
        extended: result.extended,
        timing: { durationMs: Math.round(performance.now() - performance.now()) }, // Will be captured by measure()
      };
    });
  }

  // ============================================================
  // Saved Listings
  // ============================================================
  async getSavedListings(userId: string) {
    return this.measure('getSavedListings', async () => {
      const savedListings = await db.getSavedListings(userId);
      return { saved: savedListings, count: savedListings.length };
    });
  }

  async saveListing(userId: string, listingId: string) {
    return this.measure('saveListing', async () => {
      const listing = await prisma.landListing.findUnique({ where: { id: listingId }, select: { id: true } });
      if (!listing) throw new Error('Listing not found');

      try {
        const saved = await prisma.savedListing.create({ data: { listingId, userId } });
        await marketplaceCache.invalidateListing(listingId);
        return { saved, message: 'Listing saved successfully' };
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError?.code === 'P2002') return { message: 'Listing already saved' };
        throw error;
      }
    });
  }

  async unsaveListing(userId: string, listingId: string) {
    return this.measure('unsaveListing', async () => {
      try {
        await prisma.savedListing.delete({ where: { listingId_userId: { listingId, userId } } });
        await marketplaceCache.invalidateListing(listingId);
        return { message: 'Listing removed from saved' };
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError?.code === 'P2025') return { message: 'Listing was not saved' };
        throw error;
      }
    });
  }

  // ============================================================
  // Recommendations & Trending
  // ============================================================
  async getRecommendations(userId: string) {
    return this.measure('getRecommendations', () => db.getRecommendations(userId));
  }

  async getTrending() {
    return this.measure('getTrending', () => db.getTrending());
  }

  // ============================================================
  // View Tracking (internal)
  // ============================================================
  private async trackView(listingId: string, userId?: string): Promise<void> {
    const shouldTrack = await marketplaceCache.trackView(listingId, userId);
    if (shouldTrack) await db.trackView(listingId);
  }
}

export const marketplaceService = new MarketplaceService();