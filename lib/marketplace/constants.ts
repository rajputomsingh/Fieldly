// lib/marketplace/constants.ts
export const MARKETPLACE_CONSTANTS = {
  // Cache TTLs (in seconds)
  CACHE_TTL: {
    LISTING: 300,        // 5 minutes
    FEED: 60,            // 1 minute
    AUCTION: 2,          // 2 seconds (near real-time)
    RECOMMENDATIONS: 300, // 5 minutes
    TRENDING: 300,       // 5 minutes
    BID_HISTORY: 60,     // 1 minute
    SAVED_LISTINGS: 120, // 2 minutes
    VIEW_TRACKING: 86400, // 24 hours
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Bid configuration
  BID: {
    DEFAULT_INCREMENT: 1000,
    AUTO_EXTEND_WINDOW: 5 * 60 * 1000, // 5 minutes in ms
    MAX_BIDS_PER_PAGE: 50,
    RECENT_BIDS_LIMIT: 10,
  },

  // Listing configuration
  LISTING: {
    MAX_IMAGES: 10,
    FEED_IMAGES: 3,
    PRIMARY_IMAGE_ONLY: 1,
  },

  // Score weights
  SCORE: {
    HOTNESS_WEIGHT: 0.5,
    ENGAGEMENT_WEIGHT: 0.3,
    RECENCY_WEIGHT: 0.2,
    RECENCY_WINDOW: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },

  // Query limits
  QUERY: {
    MAX_RECOMMENDATIONS: 10,
    MAX_TRENDING: 10,
    BID_HISTORY_LIMIT: 20,
  },

  // Cache key prefixes
  CACHE_KEYS: {
    LISTING: 'listing',
    FEED: 'feed',
    AUCTION: 'auction',
    RECOMMENDATIONS: 'recommendations',
    TRENDING: 'trending',
    BID_HISTORY: 'bid_history',
    SAVED: 'saved',
    VIEW: 'view',
  },
} as const;

export const PLACEHOLDER_IMAGES = {
  LAND: '/images/placeholder-land.jpg',
  AVATAR: '/images/avatar-placeholder.jpg',
} as const;