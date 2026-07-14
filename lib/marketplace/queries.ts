// lib/marketplace/queries.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { FeedFilters, PaginationParams } from './validation';
import { MARKETPLACE_CONSTANTS } from './constants';

// Query builders (no execution)
export const queries = {
  /**
   * Feed query builder
   */
  buildFeedQuery(filters: FeedFilters, pagination: PaginationParams): Prisma.LandListingFindManyArgs {
    const {
      search, minPrice, maxPrice, landType, state, district,
      minSize, maxSize, irrigation, verifiedOnly,
      sortBy = 'hotnessScore',
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.LandListingWhereInput = {
      status: 'ACTIVE',
      auctionStatus: { in: ['UPCOMING', 'LIVE'] },
      endDate: { gt: new Date() },

      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { land: { village: { contains: search, mode: 'insensitive' } } },
          { land: { district: { contains: search, mode: 'insensitive' } } },
          { land: { state: { contains: search, mode: 'insensitive' } } },
        ],
      }),

      ...((minPrice !== undefined || maxPrice !== undefined) && {
        basePrice: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),

      ...((landType || state || district || minSize !== undefined || maxSize !== undefined || irrigation) && {
        land: {
          ...(landType && { landType: landType as Prisma.EnumLandTypeFilter['equals'] }),
          ...(state && { state }),
          ...(district && { district }),
          ...((minSize !== undefined || maxSize !== undefined) && {
            size: {
              ...(minSize !== undefined && { gte: minSize }),
              ...(maxSize !== undefined && { lte: maxSize }),
            },
          }),
          ...(irrigation && { irrigationAvailable: true }),
        },
      }),

      ...(verifiedOnly && {
        owner: { landownerProfile: { isVerified: true } },
      }),
    };

    const orderBy: Prisma.LandListingOrderByWithRelationInput[] = (() => {
      switch (sortBy) {
        case 'hotnessScore': return [{ hotnessScore: 'desc' }, { engagementScore: 'desc' }, { createdAt: 'desc' }];
        case 'newest': return [{ createdAt: 'desc' }];
        case 'endingSoon': return [{ endDate: 'asc' }];
        case 'priceLowToHigh': return [{ basePrice: 'asc' }];
        case 'priceHighToLow': return [{ basePrice: 'desc' }];
        case 'mostBids': return [{ totalBids: 'desc' }];
        default: return [{ hotnessScore: 'desc' }];
      }
    })();

    return {
      where,
      orderBy,
      skip,
      take: Math.min(limit, MARKETPLACE_CONSTANTS.PAGINATION.MAX_LIMIT),
      select: {
        id: true, title: true, description: true,
        basePrice: true, highestBid: true,
        endDate: true, startDate: true, auctionStatus: true,
        minimumLeaseDuration: true, maximumLeaseDuration: true,
        createdAt: true, updatedAt: true, publishedAt: true, lastBidAt: true,
        viewCount: true, totalBids: true,
        hotnessScore: true, engagementScore: true,
        land: {
          select: {
            id: true, size: true, landType: true,
            district: true, state: true, village: true,
            latitude: true, longitude: true,
            soilType: true, irrigationAvailable: true,
            electricityAvailable: true, roadAccess: true,
            fencingAvailable: true, waterSource: true,
            images: {
              take: MARKETPLACE_CONSTANTS.LISTING.FEED_IMAGES,
              select: { id: true, url: true, caption: true, isPrimary: true },
            },
          },
        },
        owner: {
          select: {
            id: true, name: true, imageUrl: true,
            landownerProfile: { select: { isVerified: true, verificationLevel: true } },
          },
        },
        images: {
          take: MARKETPLACE_CONSTANTS.LISTING.FEED_IMAGES,
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, caption: true, isPrimary: true },
        },
        _count: { select: { bids: true, savedBy: true } },
      },
    };
  },

  // ============================================================
  // PHASE 2: OPTIMIZED Listing detail - include → select
  // ============================================================
  buildListingDetailQuery(listingId: string, userId?: string): Prisma.LandListingFindUniqueArgs {
    return {
      where: { id: listingId },
      select: {
        // Core listing fields
        id: true, title: true, description: true,
        basePrice: true, highestBid: true,
        endDate: true, startDate: true, auctionStatus: true,
        minimumLeaseDuration: true, maximumLeaseDuration: true,
        createdAt: true, updatedAt: true, publishedAt: true, lastBidAt: true,
        viewCount: true, totalBids: true,
        hotnessScore: true, engagementScore: true,

        // Land - essential fields only
        land: {
          select: {
            id: true, size: true, landType: true,
            title: true, description: true,
            district: true, state: true, village: true,
            latitude: true, longitude: true, pincode: true, address: true,
            soilType: true, irrigationAvailable: true,
            electricityAvailable: true, roadAccess: true,
            fencingAvailable: true, waterSource: true,
            images: {
              take: MARKETPLACE_CONSTANTS.LISTING.MAX_IMAGES,
              select: { id: true, url: true, caption: true, isPrimary: true },
            },
            documents: {
              select: { id: true, name: true, url: true, type: true, size: true, createdAt: true },
            },
            soilReports: {
              orderBy: { testedAt: 'desc' },
              take: 1,
            },
          },
        },

        // Owner - essential only
        owner: {
          select: {
            id: true, name: true, imageUrl: true,
            landownerProfile: { select: { isVerified: true, verificationLevel: true } },
          },
        },

        // Terms - only needed fields
        terms: {
          select: {
            id: true, listingId: true,
            securityDepositRequired: true, depositAmount: true,
            paymentFrequency: true, additionalTerms: true,
          },
        },

        // Analytics - only needed fields
        analytics: {
          select: {
            listingId: true, demandScore: true, bidVelocity: true,
            conversionScore: true, watchers: true, lastActivityAt: true,
          },
        },

        // Listing images
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, caption: true, isPrimary: true, sortOrder: true },
        },

        // Recent bids only
        bids: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: MARKETPLACE_CONSTANTS.BID.RECENT_BIDS_LIMIT,
          select: {
            id: true, amount: true, farmerId: true, createdAt: true, isAutoBid: true,
            farmer: { select: { id: true, name: true, imageUrl: true } },
          },
        },

        // Counts
        _count: { select: { bids: true, savedBy: true, applications: true } },

        // Saved status
        ...(userId && { savedBy: { where: { userId }, select: { id: true } } }),
      },
    };
  },

  /**
   * Auction room query builder
   */
  buildAuctionQuery(listingId: string): Prisma.LandListingFindUniqueArgs {
    return {
      where: { id: listingId },
      select: {
        id: true, title: true, description: true,
        basePrice: true, reservePrice: true, bidIncrement: true,
        endDate: true, startDate: true, auctionStatus: true,
        autoExtendMinutes: true, winningBidId: true,
        currentLeaderId: true, highestBid: true,
        status: true, listingType: true,
        land: {
          select: {
            latitude: true, longitude: true,
            village: true, district: true, state: true,
            size: true, landType: true,
            images: {
              take: MARKETPLACE_CONSTANTS.LISTING.PRIMARY_IMAGE_ONLY,
              select: { url: true },
            },
          },
        },
        bids: {
          where: { status: 'ACTIVE' },
          orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
          take: MARKETPLACE_CONSTANTS.BID.MAX_BIDS_PER_PAGE,
          select: {
            id: true, amount: true, farmerId: true, createdAt: true, isAutoBid: true,
            farmer: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        winningBid: {
          select: {
            id: true, amount: true,
            farmer: { select: { id: true, name: true } },
          },
        },
        _count: { select: { bids: { where: { status: 'ACTIVE' } } } },
      },
    };
  },

  /**
   * Saved listings query
   */
  buildSavedListingsQuery(userId: string) {
    return {
      where: { userId },
      include: {
        listing: {
          select: {
            id: true, title: true, basePrice: true, highestBid: true,
            endDate: true, auctionStatus: true,
            land: { select: { size: true, landType: true, village: true, district: true, state: true } },
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            _count: { select: { bids: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    };
  },
};

// Query executors
export const db = {
  async getFeed(filters: FeedFilters, pagination: PaginationParams) {
    const query = queries.buildFeedQuery(filters, pagination);
    const [listings, totalCount] = await prisma.$transaction([
      prisma.landListing.findMany(query),
      prisma.landListing.count({ where: query.where }),
    ]);
    return { listings, totalCount };
  },

  async getListing(listingId: string, userId?: string) {
    const query = queries.buildListingDetailQuery(listingId, userId);
    return prisma.landListing.findUnique(query);
  },

  async getAuction(listingId: string) {
    const query = queries.buildAuctionQuery(listingId);
    return prisma.landListing.findUnique(query);
  },

  async getSavedListings(userId: string) {
    const query = queries.buildSavedListingsQuery(userId);
    return prisma.savedListing.findMany(query);
  },

  async getBidHistory(listingId: string, limit = 20) {
    return prisma.bid.findMany({
      where: { listingId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, amount: true, farmerId: true, createdAt: true, isAutoBid: true,
        farmer: { select: { id: true, name: true, imageUrl: true } },
      },
    });
  },

  async getRecommendations(userId: string, limit = 10) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true },
    });

    const where: Prisma.LandListingWhereInput = {
      status: 'ACTIVE',
      auctionStatus: { in: ['UPCOMING', 'LIVE'] },
      endDate: { gt: new Date() },
      NOT: { ownerId: userId },
    };

    if (user?.farmerProfile) {
      where.land = {
        size: {
          gte: user.farmerProfile.requiredLandSize * 0.8,
          lte: user.farmerProfile.requiredLandSize * 1.2,
        },
      };
    }

    return prisma.landListing.findMany({
      where,
      take: limit,
      orderBy: [{ hotnessScore: 'desc' }, { engagementScore: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, title: true, basePrice: true, highestBid: true,
        endDate: true, auctionStatus: true, hotnessScore: true, engagementScore: true,
        land: { select: { size: true, landType: true, district: true, state: true, village: true, images: { take: 1, select: { url: true } } } },
        _count: { select: { bids: true } },
      },
    });
  },

  async getTrending(limit = 10) {
    return prisma.landListing.findMany({
      where: { status: 'ACTIVE', auctionStatus: { in: ['UPCOMING', 'LIVE'] }, endDate: { gt: new Date() } },
      take: limit,
      orderBy: [{ engagementScore: 'desc' }, { hotnessScore: 'desc' }, { viewCount: 'desc' }, { totalBids: 'desc' }],
      select: {
        id: true, title: true, basePrice: true, highestBid: true,
        endDate: true, auctionStatus: true, viewCount: true, totalBids: true,
        land: { select: { size: true, landType: true, district: true, state: true, village: true, images: { take: 1, select: { url: true } } } },
        _count: { select: { bids: true } },
      },
    });
  },

  async checkUserBid(userId: string, listingId: string) {
    return prisma.bid.findFirst({ where: { farmerId: userId, listingId, status: 'ACTIVE' } });
  },

  async trackView(listingId: string): Promise<void> {
    await prisma.$transaction([
      prisma.landListing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }),
      prisma.listingAnalytics.upsert({
        where: { listingId },
        update: { lastActivityAt: new Date() },
        create: { listingId, lastActivityAt: new Date() },
      }),
    ]);
  },
};