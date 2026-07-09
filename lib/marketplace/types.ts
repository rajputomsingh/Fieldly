import type { Prisma } from "@prisma/client";

// Re-export Prisma types
export type ListingWithIncludes = Prisma.LandListingGetPayload<{
  include: {
    land: { include: { images: true; documents: true; soilReports: true } };
    owner: { include: { landownerProfile: true } };
    images: true;
    terms: true;
    analytics: true;
    bids: { include: { farmer: true } };
    _count: { select: { bids: true; savedBy: true; applications: true } };
  };
}>;

// DTO Types
export interface MarketplaceFeedItemDTO {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  highestBid: number | null;
  endDate: string;
  startDate: string;
  auctionStatus: string;
  minimumLeaseDuration: number;
  maximumLeaseDuration: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  lastBidAt: string | null;
  viewCount: number;
  totalBids: number;
  hotnessScore: number | null;
  engagementScore: number | null;
  images: ImageDTO[];
  land: LandDTO;
  owner: OwnerDTO | null;
  marketplaceScore: number;
  _count: CountsDTO;
}

export interface ListingDetailDTO {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  highestBid: number | null;
  endDate: string;
  startDate: string;
  auctionStatus: string;
  minimumLeaseDuration: number;
  maximumLeaseDuration: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  lastBidAt: string | null;
  viewCount: number;
  totalBids: number;
  hotnessScore: number | null;
  engagementScore: number | null;
  land: LandDetailDTO;
  owner: OwnerDTO | null;
  images: ImageDTO[];
  terms: Record<string, unknown> | null;
  documents: DocumentDTO[];
  soilReports: SoilReportDTO[];
  bids: BidDTO[];
  isSaved: boolean;
  _count: CountsDTO;
}

export interface AuctionDTO {
  listing: AuctionListingDTO;
  stats: AuctionStatsDTO;
}

export interface BidDTO {
  id: string;
  amount: number;
  farmerId: string;
  createdAt: string;
  isAutoBid: boolean;
  farmer: BidFarmerDTO;
}

export interface BidFarmerDTO {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface ImageDTO {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  sortOrder?: number;
}

export interface LandDTO {
  id: string;
  size: number;
  landType: string;
  district: string | null;
  state: string | null;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  location: string;
  soilType: string | null;
  irrigationAvailable: boolean;
  electricityAvailable: boolean | null;
  roadAccess: boolean | null;
  fencingAvailable: boolean | null;
  waterSource: string | null;
  images?: ImageDTO[];
}

export interface LandDetailDTO extends LandDTO {
  title: string | null;
  description: string | null;
  pincode: string | null;
  address: string | null;
  fullAddress: string | null;
  images: ImageDTO[];
}

export interface OwnerDTO {
  id: string;
  name: string;
  imageUrl: string | null;
  isVerified: boolean;
  verificationLevel: number;
  landownerProfile?: {
    isVerified: boolean;
    verificationLevel?: number;
  } | null;
}

export interface DocumentDTO {
  id: string;
  name: string;
  url: string;
  type: string | null;
  size: number | null;
  createdAt: string | null;
}

export interface SoilReportDTO {
  id: string;
  reportUrl: string | null;
  ph: number | null;
  moisture: number | null;
  nutrients: string | null;
  testedBy: string | null;
  testedAt: string | null;
}

export interface MarketplaceScore {
  total: number;
  components: {
    hotness: number;
    engagement: number;
    recency: number;
  };
}

export interface CountsDTO {
  bids: number;
  savedBy: number;
  applications?: number;
}

export interface AuctionListingDTO {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  highestBid: number | null;
  endDate: string;
  startDate: string;
  auctionStatus: string;
  autoExtendMinutes: number | null;
  bidIncrement: number;
  currentLeaderId: string | null;
  land: AuctionLandDTO;
  bids: BidDTO[];
  winningBid: AuctionWinningBidDTO | null;
}

export interface AuctionLandDTO {
  mapUrl: string | null;
  location: string;
  size: number;
  landType: string;
  images: { url: string }[];
}

export interface AuctionWinningBidDTO {
  id: string;
  amount: number;
  farmer: {
    id: string;
    name: string;
  };
}

export interface AuctionStatsDTO {
  totalBids: number;
  uniqueBidders: number;
  timeRemaining: number;
  status: string;
  currentLeader: AuctionWinningBidDTO | null;
  bidHistory: BidDTO[];
}

export interface BidPlacementResult {
  success: boolean;
  bid: BidDTO;
  extended: boolean;
  timing: { durationMs: number };
}