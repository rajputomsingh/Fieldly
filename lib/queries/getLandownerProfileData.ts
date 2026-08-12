// lib/queries/getLandownerProfileData.ts
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getLandownerProfileData = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      email: true,
      imageUrl: true,
      bio: true,
      state: true,
      district: true,
      createdAt: true,
      role: true,

      landownerProfile: {
        select: {
          isVerified: true,
          verificationLevel: true,
        },
      },

      listingsOwned: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          title: true,
          basePrice: true,
          totalBids: true,
          viewCount: true,
          createdAt: true,
          endDate: true,
          hotnessScore: true,
          listingType: true,
          auctionStatus: true,
          images: {
            where: { isPrimary: true },
            select: { url: true, isPrimary: true },
            take: 1,
          },
          land: {
            select: {
              size: true,
              village: true,
              landType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },

      leasesAsOwner: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          rent: true,
          startDate: true,
          endDate: true,
        },
      },

      leasesAsFarmer: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },

      reviewsReceived: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  const totalListings = user.listingsOwned.length;
  const activeListings = user.listingsOwned.filter(
    (l) => l.auctionStatus === "LIVE" || l.auctionStatus === "UPCOMING",
  ).length;

  const totalRevenue = user.leasesAsOwner.reduce(
    (acc, l) => acc + (l.rent?.toNumber() ?? 0),
    0,
  );

  const avgRating =
    user.reviewsReceived.length > 0
      ? user.reviewsReceived.reduce((a, r) => a + r.rating, 0) /
        user.reviewsReceived.length
      : null;

  const totalReviews = user.reviewsReceived.length;

  const responseRate = 98;

  return {
    user: {
      id: user.id,
      clerkId: user.clerkUserId,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      bio: user.bio,
      location:
        user.district && user.state
          ? `${user.district}, ${user.state}`
          : user.state || user.district || null,
      joinedAt: user.createdAt,
      isVerified: user.landownerProfile?.isVerified ?? false,
      role: user.role,
      avgRating: avgRating ?? undefined,
      totalReviews,
    },

    stats: {
      totalListings,
      activeListings,
      activeLeases: user.leasesAsOwner.length,
      completedLeases: user.leasesAsFarmer.length,
      totalRevenue,
      avgRating,
      totalReviews,
      responseRate,
      listingsTrend: 12,
      revenueTrend: 8,
    },

    listings: user.listingsOwned.map((listing) => ({
      ...listing,
      basePrice: listing.basePrice?.toNumber() ?? 0,
      isUrgent: listing.endDate
        ? new Date(listing.endDate).getTime() - new Date().getTime() <
          7 * 24 * 60 * 60 * 1000
        : false,
      maxBids: 50,
    })),
  };
});
