CREATE INDEX IF NOT EXISTS "idx_land_landowner_active"
ON "Land"("landownerId", "isActive", "isArchived");

CREATE INDEX IF NOT EXISTS "idx_landlisting_feed_main"
ON "LandListing"("status", "auctionStatus", "endDate", "hotnessScore" DESC);

CREATE INDEX IF NOT EXISTS "idx_landlisting_feed_sort"
ON "LandListing"("status", "auctionStatus", "hotnessScore" DESC, "engagementScore" DESC, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_listingimage_listing_id_sort"
ON "ListingImage"("listingId", "sortOrder");
