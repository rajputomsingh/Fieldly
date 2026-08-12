// app/api/admin/listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";
import { logDetailedAction } from "@/lib/server/audit-logger";
import { headers } from "next/headers";
import { ListingStatus, ListingType, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const listingType = searchParams.get("listingType");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Build where clause with proper types
    const where: Prisma.LandListingWhereInput = {};

    if (status && status !== "all") {
      where.status = status as ListingStatus;
    }

    if (listingType && listingType !== "all") {
      where.listingType = listingType as ListingType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        {
          land: { village: { contains: search, mode: "insensitive" as const } },
        },
        {
          land: {
            district: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    const allowedSortFields = ["title", "basePrice", "status", "createdAt"];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const [listings, total, stats, activeBidsCount, pendingReviewsCount] =
      await Promise.all([
        prisma.landListing.findMany({
          where,
          include: {
            land: {
              select: {
                size: true,
                landType: true,
                village: true,
                district: true,
              },
            },
            owner: {
              select: { name: true, email: true },
            },
            _count: {
              select: { applications: true, bids: true },
            },
          },
          orderBy: { [validSortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.landListing.count({ where }),
        prisma.landListing.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),
        prisma.bid.count({
          where: { status: "ACTIVE" },
        }),
        prisma.landListing.count({
          where: { status: "PENDING_APPROVAL" },
        }),
      ]);

    const totalValue = listings.reduce(
      (sum, l) => sum + (l.basePrice?.toNumber() ?? 0),
      0,
    );

    await logDetailedAction({
      adminId: admin.id,
      action: "VIEW_LISTINGS",
      entity: "LISTING",
      metadata: {
        filters: { status, listingType, search },
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    const byStatus: Record<string, number> = {};
    stats.forEach((s) => {
      byStatus[s.status] = s._count;
    });

    return NextResponse.json({
      listings,
      stats: {
        total,
        totalValue,
        byStatus,
        activeBids: activeBidsCount,
        pendingReviews: pendingReviewsCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Listings fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch listings",
      },
      { status: 500 },
    );
  }
}

// PATCH for updating listing status (uses body.listingId, not URL param)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();
    const { listingId, status, reason } = await req.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID required" },
        { status: 400 },
      );
    }

    const currentListing = await prisma.landListing.findUnique({
      where: { id: listingId },
      select: { status: true, title: true, listingType: true },
    });

    if (!currentListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Validate status transition
    const validStatuses = ["ACTIVE", "CLOSED", "CANCELLED", "PENDING_APPROVAL"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Map to Prisma enum
    const prismaStatus = status as ListingStatus;

    const listing = await prisma.landListing.update({
      where: { id: listingId },
      data: {
        status: prismaStatus,
        publishedAt: status === "ACTIVE" ? new Date() : undefined,
      },
      include: {
        land: { select: { id: true } },
        owner: { select: { name: true, email: true } },
      },
    });

    const actionMap: Record<string, string> = {
      ACTIVE: "APPROVE_LISTING",
      CLOSED: "CLOSE_LISTING",
      CANCELLED: "CANCEL_LISTING",
      PENDING_APPROVAL: "PENDING_LISTING",
    };

    await logDetailedAction({
      adminId: admin.id,
      action: actionMap[status] || "UPDATE_LISTING",
      entity: "LISTING",
      entityId: listingId,
      changes: {
        before: { status: currentListing.status },
        after: { status: listing.status },
        reason,
      },
      metadata: {
        listingTitle: currentListing.title,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true, listing });
  } catch (error) {
    console.error("Listing update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
