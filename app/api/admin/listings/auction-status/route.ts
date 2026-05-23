// app/api/admin/listings/auction-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";
import { logDetailedAction } from "@/lib/server/audit-logger";
import { headers } from "next/headers";
import { AuctionStatus, NotificationType } from "@prisma/client";
import { notifyAuctionStatusChange } from "@/services/notifications/notificationTrigger.service"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();
    const body = await req.json();
    const { listingId, auctionStatus, reason } = body;

    if (!listingId || !auctionStatus) {
      return NextResponse.json(
        { error: "Listing ID and auction status required" },
        { status: 400 }
      );
    }

    const validStatuses = ["UPCOMING", "LIVE", "PAUSED", "CLOSED", "SETTLED", "FAILED"];
    if (!validStatuses.includes(auctionStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const currentListing = await prisma.landListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        auctionStatus: true,
        ownerId: true,
        status: true,
      },
    });

    if (!currentListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (auctionStatus === "LIVE" && currentListing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cannot set auction to LIVE when listing is not ACTIVE" },
        { status: 400 }
      );
    }

    const updatedListing = await prisma.landListing.update({
      where: { id: listingId },
      data: { auctionStatus: auctionStatus as AuctionStatus },
    });

    // Notify landowner
    await prisma.notification.create({
      data: {
        userId: currentListing.ownerId,
        type: NotificationType.LISTING,
        title: `Auction ${auctionStatus === "LIVE" ? "Started" : "Updated"}`,
        message: auctionStatus === "LIVE"
          ? `Your auction for "${currentListing.title}" is now LIVE! Farmers can place bids.`
          : `Auction status updated to ${auctionStatus}.${reason ? ` Reason: ${reason}` : ""}`,
        actionUrl: `/marketplace/listings/${listingId}`,
        entityId: listingId,
        entityType: "LISTING",
      },
    });

    // NOTIFY FARMERS (WATCHERS & BIDDERS) ABOUT AUCTION STATUS CHANGE
    if (auctionStatus === "LIVE" || auctionStatus === "CLOSED" || auctionStatus === "SETTLED") {
      const oldStatus = currentListing.auctionStatus || "UPCOMING";
      console.log(`🔔 Triggering farmer notifications for auction status change: ${oldStatus} → ${auctionStatus}`);
      
      const notifyResult = await notifyAuctionStatusChange(
        listingId, 
        oldStatus, 
        auctionStatus, 
        reason
      );
      
      console.log(`📢 Farmer notification result:`, notifyResult);
    }

    await logDetailedAction({
      adminId: admin.id,
      action: "CHANGE_AUCTION_STATUS",
      entity: "LISTING",
      entityId: listingId,
      changes: {
        before: { auctionStatus: currentListing.auctionStatus },
        after: { auctionStatus },
        reason,
      },
      metadata: {
        listingTitle: currentListing.title,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: `Auction status changed to ${auctionStatus}`,
    });
  } catch (error) {
    console.error("Auction status change error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update auction status" },
      { status: 500 }
    );
  }
}