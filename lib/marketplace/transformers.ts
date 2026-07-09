// lib/marketplace/transformers.ts
import { getImageUrl } from '@/lib/supabase-image';
import { MARKETPLACE_CONSTANTS, PLACEHOLDER_IMAGES } from './constants';
import type {
  MarketplaceFeedItemDTO,
  ListingDetailDTO,
  AuctionDTO,
  BidDTO,
  ImageDTO,
  LandDTO,
  LandDetailDTO,
  OwnerDTO,
  DocumentDTO,
  SoilReportDTO,
  MarketplaceScore,
  AuctionListingDTO,
  AuctionLandDTO,
  AuctionWinningBidDTO,
  AuctionStatsDTO,
  BidFarmerDTO,
} from './types';
// Remove: import type { Prisma } from '@prisma/client';

// Helper types for Prisma results
type ListingWithLand = {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  highestBid: number | null;
  endDate: Date | string;
  startDate: Date | string;
  auctionStatus: string;
  minimumLeaseDuration: number;
  maximumLeaseDuration: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt: Date | string | null;
  lastBidAt: Date | string | null;
  viewCount: number;
  totalBids: number;
  hotnessScore: number | null;
  engagementScore: number | null;
  land?: Record<string, unknown> | null;
  owner?: Record<string, unknown> | null;
  images?: Array<Record<string, unknown>>;
  terms?: Record<string, unknown> | null;
  analytics?: Record<string, unknown> | null;
  bids?: Array<Record<string, unknown>>;
  savedBy?: Array<{ id: string }>;
  _count?: {
    bids?: number;
    savedBy?: number;
    applications?: number;
  };
};

/**
 * Transform raw Prisma data to DTOs
 */
export const transformers = {
  /**
   * Transform image URL
   */
  transformImage(image: Record<string, unknown>): ImageDTO {
    return {
      id: image.id as string,
      url: getImageUrl(image.url as string) || PLACEHOLDER_IMAGES.LAND,
      caption: (image.caption as string) || null,
      isPrimary: (image.isPrimary as boolean) || false,
      sortOrder: image.sortOrder as number | undefined,
    };
  },

  /**
   * Transform owner data
   * FIX: Return string | null for imageUrl to match OwnerDTO
   */
  transformOwner(owner: Record<string, unknown>): OwnerDTO {
    const profile = owner.landownerProfile as Record<string, unknown> | undefined;
    
    return {
      id: owner.id as string,
      name: owner.name as string,
      imageUrl: owner.imageUrl 
        ? getImageUrl(owner.imageUrl as string) 
        : null,  // Return null instead of placeholder
      isVerified: (profile?.isVerified as boolean) || false,
      verificationLevel: (profile?.verificationLevel as number) || 0,
    };
  },

  /**
   * Transform land data for feed
   */
  transformLandForFeed(land: Record<string, unknown>): LandDTO {
    const location = [
      land.village,
      land.district,
      land.state,
    ].filter(Boolean).join(', ') || 'Location not specified';

    const latitude = land.latitude as number | null;
    const longitude = land.longitude as number | null;

    const mapUrl = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : (land.district && land.state)
        ? `https://www.google.com/maps/search/${encodeURIComponent(location)}`
        : null;

    return {
      id: land.id as string,
      size: land.size as number,
      landType: land.landType as string,
      district: (land.district as string) || null,
      state: (land.state as string) || null,
      village: (land.village as string) || null,
      latitude,
      longitude,
      mapUrl,
      location,
      soilType: (land.soilType as string) || null,
      irrigationAvailable: (land.irrigationAvailable as boolean) || false,
      electricityAvailable: (land.electricityAvailable as boolean) || null,
      roadAccess: (land.roadAccess as boolean) || null,
      fencingAvailable: (land.fencingAvailable as boolean) || null,
      waterSource: (land.waterSource as string) || null,
    };
  },

  /**
   * Transform land data for detail view
   */
  transformLandForDetail(land: Record<string, unknown>): LandDetailDTO {
    const baseLand = this.transformLandForFeed(land);
    const images = (land.images as Array<Record<string, unknown>>) || [];

    return {
      ...baseLand,
      title: (land.title as string) || null,
      description: (land.description as string) || null,
      pincode: (land.pincode as string) || null,
      address: (land.address as string) || null,
      fullAddress: this.buildFullAddress(land),
      images: images.map(img => this.transformImage(img)),
    };
  },

  /**
   * Build full address string
   */
  buildFullAddress(land: Record<string, unknown>): string | null {
    const parts = [
      land.address,
      land.village,
      land.district,
      land.state,
      land.pincode,
    ].filter(Boolean) as string[];
    
    return parts.length > 0 ? parts.join(', ') : null;
  },

  /**
   * Transform bid data
   */
  transformBid(bid: Record<string, unknown>): BidDTO {
    const farmer = (bid.farmer as Record<string, unknown>) || {};
    
    return {
      id: bid.id as string,
      amount: bid.amount as number,
      farmerId: bid.farmerId as string,
      createdAt: bid.createdAt instanceof Date 
        ? bid.createdAt.toISOString() 
        : bid.createdAt as string,
      isAutoBid: (bid.isAutoBid as boolean) || false,
      farmer: this.transformBidFarmer(farmer, bid.farmerId as string),
    };
  },

  /**
   * Transform bid farmer data
   * FIX: Return string | null for imageUrl to match BidFarmerDTO
   */
  transformBidFarmer(farmer: Record<string, unknown>, fallbackId: string): BidFarmerDTO {
    return {
      id: (farmer.id as string) || fallbackId,
      name: (farmer.name as string) || 'Unknown Farmer',
      imageUrl: farmer.imageUrl
        ? getImageUrl(farmer.imageUrl as string)
        : null,  // Return null instead of placeholder
    };
  },

  /**
   * Transform document data
   */
  transformDocument(doc: Record<string, unknown>): DocumentDTO {
    return {
      id: doc.id as string,
      name: doc.name as string,
      url: getImageUrl(doc.url as string) || '',
      type: (doc.type as string) || null,
      size: (doc.size as number) || null,
      createdAt: doc.createdAt 
        ? new Date(doc.createdAt as string).toISOString() 
        : null,
    };
  },

  /**
   * Transform soil report data
   */
  transformSoilReport(report: Record<string, unknown>): SoilReportDTO {
    return {
      id: report.id as string,
      reportUrl: report.reportUrl ? getImageUrl(report.reportUrl as string) : null,
      ph: (report.ph as number) || null,
      moisture: (report.moisture as number) || null,
      nutrients: (report.nutrients as string) || null,
      testedBy: (report.testedBy as string) || null,
      testedAt: report.testedAt 
        ? new Date(report.testedAt as string).toISOString() 
        : null,
    };
  },

  /**
   * Calculate marketplace score
   */
  calculateScore(listing: ListingWithLand): MarketplaceScore {
    const createdAt = new Date(listing.createdAt).getTime();
    const recencyScore = Math.max(
      0,
      1 - (Date.now() - createdAt) / MARKETPLACE_CONSTANTS.SCORE.RECENCY_WINDOW
    );

    return {
      total:
        (listing.hotnessScore || 0) * MARKETPLACE_CONSTANTS.SCORE.HOTNESS_WEIGHT +
        (listing.engagementScore || 0) * MARKETPLACE_CONSTANTS.SCORE.ENGAGEMENT_WEIGHT +
        recencyScore * MARKETPLACE_CONSTANTS.SCORE.RECENCY_WEIGHT,
      components: {
        hotness: listing.hotnessScore || 0,
        engagement: listing.engagementScore || 0,
        recency: recencyScore,
      },
    };
  },

  /**
   * Transform feed listing
   */
  transformFeedListing(listing: Record<string, unknown>): MarketplaceFeedItemDTO {
    const land = listing.land as Record<string, unknown> | undefined;
    const owner = listing.owner as Record<string, unknown> | undefined;
    const images = (listing.images as Array<Record<string, unknown>>) || [];
    const counts = (listing._count as Record<string, number>) || {};

    return {
      id: listing.id as string,
      title: listing.title as string,
      description: (listing.description as string) || null,
      basePrice: listing.basePrice as number,
      highestBid: (listing.highestBid as number) || null,
      endDate: listing.endDate instanceof Date ? listing.endDate.toISOString() : listing.endDate as string,
      startDate: listing.startDate instanceof Date ? listing.startDate.toISOString() : listing.startDate as string,
      auctionStatus: listing.auctionStatus as string,
      minimumLeaseDuration: listing.minimumLeaseDuration as number,
      maximumLeaseDuration: listing.maximumLeaseDuration as number,
      createdAt: listing.createdAt instanceof Date ? listing.createdAt.toISOString() : listing.createdAt as string,
      updatedAt: listing.updatedAt instanceof Date ? listing.updatedAt.toISOString() : listing.updatedAt as string,
      publishedAt: listing.publishedAt ? new Date(listing.publishedAt as string).toISOString() : null,
      lastBidAt: listing.lastBidAt ? new Date(listing.lastBidAt as string).toISOString() : null,
      viewCount: (listing.viewCount as number) || 0,
      totalBids: (listing.totalBids as number) || 0,
      hotnessScore: listing.hotnessScore as number | null,
      engagementScore: listing.engagementScore as number | null,
      images: images.map(img => this.transformImage(img)),
      land: land ? this.transformLandForFeed(land) : {} as LandDTO,
      owner: owner ? this.transformOwner(owner) : null,
      marketplaceScore: this.calculateScore(listing as unknown as ListingWithLand).total,
      _count: {
        bids: counts.bids || 0,
        savedBy: counts.savedBy || 0,
      },
    };
  },

  /**
   * Transform listing detail
   */
  transformListingDetail(listing: Record<string, unknown>): ListingDetailDTO {
    const land = listing.land as Record<string, unknown> | undefined;
    const owner = listing.owner as Record<string, unknown> | undefined;
    const images = (listing.images as Array<Record<string, unknown>>) || [];
    const bids = (listing.bids as Array<Record<string, unknown>>) || [];
    const documents = land?.documents as Array<Record<string, unknown>> | undefined;
    const soilReports = land?.soilReports as Array<Record<string, unknown>> | undefined;
    const savedBy = listing.savedBy as Array<{ id: string }> | undefined;
    const counts = (listing._count as Record<string, number>) || {};

    return {
      id: listing.id as string,
      title: listing.title as string,
      description: (listing.description as string) || null,
      basePrice: listing.basePrice as number,
      highestBid: (listing.highestBid as number) || null,
      endDate: listing.endDate instanceof Date ? listing.endDate.toISOString() : listing.endDate as string,
      startDate: listing.startDate instanceof Date ? listing.startDate.toISOString() : listing.startDate as string,
      auctionStatus: listing.auctionStatus as string,
      minimumLeaseDuration: listing.minimumLeaseDuration as number,
      maximumLeaseDuration: listing.maximumLeaseDuration as number,
      createdAt: listing.createdAt instanceof Date ? listing.createdAt.toISOString() : listing.createdAt as string,
      updatedAt: listing.updatedAt instanceof Date ? listing.updatedAt.toISOString() : listing.updatedAt as string,
      publishedAt: listing.publishedAt ? new Date(listing.publishedAt as string).toISOString() : null,
      lastBidAt: listing.lastBidAt ? new Date(listing.lastBidAt as string).toISOString() : null,
      viewCount: (listing.viewCount as number) || 0,
      totalBids: (listing.totalBids as number) || 0,
      hotnessScore: listing.hotnessScore as number | null,
      engagementScore: listing.engagementScore as number | null,
      land: land ? this.transformLandForDetail(land) : {} as LandDetailDTO,
      owner: owner ? this.transformOwner(owner) : null,
      images: images.map(img => this.transformImage(img)),
      terms: (listing.terms as Record<string, unknown>) || null,
      documents: (documents || []).map(doc => this.transformDocument(doc)),
      soilReports: (soilReports || []).map(report => this.transformSoilReport(report)),
      bids: bids.map(bid => this.transformBid(bid)),
      isSaved: savedBy && savedBy.length > 0 ? true : false,
      _count: {
        bids: counts.bids || 0,
        savedBy: counts.savedBy || 0,
        applications: counts.applications || 0,
      },
    };
  },

  /**
   * Transform auction data
   */
  transformAuction(auctionData: Record<string, unknown>): AuctionDTO {
    const land = auctionData.land as Record<string, unknown> | undefined;
    const landImages = (land?.images as Array<Record<string, unknown>>) || [];
    const bids = (auctionData.bids as Array<Record<string, unknown>>) || [];
    const winningBid = auctionData.winningBid as Record<string, unknown> | null;
    const counts = (auctionData._count as Record<string, { bids: number }>) || {};

    const uniqueBidders = new Set(
      bids.map(b => b.farmerId as string)
    ).size;

    const endDate = auctionData.endDate instanceof Date 
      ? auctionData.endDate 
      : new Date(auctionData.endDate as string);

    const location = [
      land?.village,
      land?.district,
      land?.state,
    ].filter(Boolean).join(', ') || 'Location not specified';

    const latitude = land?.latitude as number | null;
    const longitude = land?.longitude as number | null;

    const auctionLand: AuctionLandDTO = {
      mapUrl: latitude && longitude
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : null,
      location,
      size: (land?.size as number) || 0,
      landType: (land?.landType as string) || 'Unknown',
      images: landImages.map(img => ({
        url: getImageUrl(img.url as string) || PLACEHOLDER_IMAGES.LAND,
      })),
    };

    const transformedBids = bids.map(bid => this.transformBid(bid));

    const winningBidDTO: AuctionWinningBidDTO | null = winningBid ? {
      id: winningBid.id as string,
      amount: winningBid.amount as number,
      farmer: {
        id: (winningBid.farmer as Record<string, unknown>)?.id as string || '',
        name: (winningBid.farmer as Record<string, unknown>)?.name as string || 'Unknown',
      },
    } : null;

    const listing: AuctionListingDTO = {
      id: auctionData.id as string,
      title: auctionData.title as string,
      description: (auctionData.description as string) || null,
      basePrice: auctionData.basePrice as number,
      highestBid: (auctionData.highestBid as number) || null,
      endDate: endDate.toISOString(),
      startDate: auctionData.startDate instanceof Date 
        ? auctionData.startDate.toISOString() 
        : auctionData.startDate as string,
      auctionStatus: auctionData.auctionStatus as string,
      autoExtendMinutes: (auctionData.autoExtendMinutes as number) || null,
      bidIncrement: (auctionData.bidIncrement as number) || MARKETPLACE_CONSTANTS.BID.DEFAULT_INCREMENT,
      currentLeaderId: (auctionData.currentLeaderId as string) || null,
      land: auctionLand,
      bids: transformedBids,
      winningBid: winningBidDTO,
    };

    const stats: AuctionStatsDTO = {
      totalBids: counts.bids?.bids || 0,
      uniqueBidders,
      timeRemaining: Math.max(0, endDate.getTime() - Date.now()),
      status: auctionData.auctionStatus as string,
      currentLeader: winningBidDTO,
      bidHistory: transformedBids.slice(0, MARKETPLACE_CONSTANTS.BID.RECENT_BIDS_LIMIT),
    };

    return { listing, stats };
  },
};