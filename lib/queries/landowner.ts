// lib/queries/landowner.ts
import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 MAP URL HELPERS
 */
function getGoogleMapsUrl(lat?: number | null, lng?: number | null) {
  if (!lat || !lng) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function getGoogleEmbedUrl(lat?: number | null, lng?: number | null) {
  if (!lat || !lng) return null;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
}

export interface LandWithDetails {
  id: string;
  title: string;
  size: number;
  landType: string;
  status: "LEASED" | "AVAILABLE";
  location: string;

  expectedRentMin: number | null;
  expectedRentMax: number | null;

  applicationsCount: number;

  mapUrl: string | null;
  embedMapUrl: string | null;

  activeLease: {
    id: string;
    farmerName: string;
    rent: number;
    startDate: Date;
    endDate: Date;
  } | null;

  createdAt: Date;
}

export const getLandownerDashboardData = cache(
  async (clerkId: string, page: number) => {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkId },
      select: {
        id: true,
        name: true,
        landownerProfile: { select: { id: true } },
      },
    });

    if (!user?.landownerProfile) return null;

    const profileId = user.landownerProfile.id;
    const userId = user.id;

    const pageSize = 6;
    const skip = (page - 1) * pageSize;

    const baseLandWhere = {
      landownerId: profileId,
      isArchived: false,
    };

    const [
      allLands,
      activeLeases,
      pendingApplicationsCount,
      revenueAgg,
      totalLands,
      lands,
    ] = await Promise.all([
      prisma.land.findMany({
        where: { ...baseLandWhere, isActive: true },
        select: { id: true, size: true },
      }),

      prisma.lease.findMany({
        where: { ownerId: userId, status: "ACTIVE" },
        select: { id: true, landId: true },
      }),

      prisma.application.count({
        where: {
          land: baseLandWhere,
          status: "PENDING",
        },
      }),

      prisma.payment.aggregate({
        where: {
          lease: { ownerId: user.id },
          status: "SUCCESS",
        },
        _sum: { amount: true },
      }),

      prisma.land.count({
        where: baseLandWhere,
      }),

      prisma.land.findMany({
        where: baseLandWhere,
        select: {
          id: true,
          title: true,
          size: true,
          landType: true,
          village: true,
          latitude: true,
          longitude: true,
          expectedRentMin: true,
          expectedRentMax: true,
          createdAt: true,
          _count: { select: { applications: true } },
          leases: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              rent: true,
              startDate: true,
              endDate: true,
              farmer: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
    ]);

    const leasedLandIds = new Set(activeLeases.map((l) => l.landId));

    let leasedArea = 0;
    let availableArea = 0;

    for (const land of allLands) {
      if (leasedLandIds.has(land.id)) leasedArea += land.size;
      else availableArea += land.size;
    }

    const totalRevenue = revenueAgg._sum.amount?.toNumber() ?? 0;

    const stats = {
      totalLands,
      activeLeases: activeLeases.length,
      pendingApplications: pendingApplicationsCount,
      monthlyRevenue: totalRevenue / 12,
      totalRevenue,
      leasedArea,
      availableArea,
    };

    const landsFormatted: LandWithDetails[] = lands.map((l) => {
      const status: "LEASED" | "AVAILABLE" =
        l.leases.length > 0 ? "LEASED" : "AVAILABLE";

      return {
        id: l.id,
        title: l.title,
        size: l.size,
        landType: l.landType,
        status,
        location: l.village ?? "Location not specified",

        expectedRentMin: l.expectedRentMin?.toNumber() ?? null,
        expectedRentMax: l.expectedRentMax?.toNumber() ?? null,
        applicationsCount: l._count.applications,

        mapUrl: getGoogleMapsUrl(l.latitude, l.longitude),
        embedMapUrl: getGoogleEmbedUrl(l.latitude, l.longitude),

        activeLease: l.leases[0]
          ? {
              id: l.leases[0].id,
              farmerName: l.leases[0].farmer.name,
              rent: l.leases[0].rent?.toNumber() ?? 0,
              startDate: l.leases[0].startDate,
              endDate: l.leases[0].endDate,
            }
          : null,

        createdAt: l.createdAt,
      };
    });

    const revenueTrend = Array.from({ length: 6 }).map((_, i) => ({
      month: `M${i + 1}`,
      revenue: totalRevenue / 6,
    }));

    return {
      user,
      stats,
      lands: landsFormatted,
      totalLands,
      revenueTrend,
    };
  },
);