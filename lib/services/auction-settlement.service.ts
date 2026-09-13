// lib/services/auction-settlement.service.ts
import { prisma } from "@/lib/prisma";
import {
  AuctionStatus,
  BidStatus,
  ListingStatus,
} from "@prisma/client";
import { createNotification } from "@/actions/notifications/createNotification";
import { LeaseService } from "./lease.service";

interface SettlementResult {
  success: boolean;
  listingId: string;
  winningBidId: string | null;
  leaseId: string | null;
  message: string;
}

export class AuctionSettlementService {
  /**
   * Settle a CLOSED auction:
   * 1. Find highest ACTIVE bid
   * 2. Mark winner + outbid losers
   * 3. Update listing (SETTLED, winningBidId, currentLeaderId)
   * 4. Create Lease via LeaseService (idempotent)
   * 5. Update Land availability
   * 6. Write audit log
   *
   * Note: notification is sent AFTER the transaction commits, via
   * notifySettlement(). Do not call createNotification inside the tx.
   */
  static async settleAuction(listingId: string): Promise<SettlementResult> {
    return prisma.$transaction(
      async (tx) => {
        // 1. Fetch listing with active bids
        const listing = await tx.landListing.findUnique({
          where: { id: listingId },
          include: {
            land: { select: { id: true, title: true, landownerId: true } },
            owner: { select: { id: true, name: true } },
            bids: {
              where: { status: BidStatus.ACTIVE },
              orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
              include: { farmer: { select: { id: true, name: true } } },
            },
          },
        });

        if (!listing) {
          return {
            success: false,
            listingId,
            winningBidId: null,
            leaseId: null,
            message: "Listing not found",
          };
        }

        if (listing.auctionStatus !== AuctionStatus.CLOSED) {
          return {
            success: false,
            listingId,
            winningBidId: null,
            leaseId: null,
            message: `Auction is ${listing.auctionStatus}, not CLOSED`,
          };
        }

        // 2. Select highest valid bid
        const winningBid = listing.bids[0];
        if (!winningBid) {
          await tx.landListing.update({
            where: { id: listingId },
            data: {
              auctionStatus: AuctionStatus.FAILED,
              status: ListingStatus.CANCELLED,
            },
          });
          return {
            success: false,
            listingId,
            winningBidId: null,
            leaseId: null,
            message: "No valid bids - auction failed",
          };
        }

        // 3. Mark winner + outbid losers
        await tx.bid.update({
          where: { id: winningBid.id },
          data: { status: BidStatus.ACCEPTED, isWinning: true },
        });

        const losingBids = listing.bids.filter((b) => b.id !== winningBid.id);
        if (losingBids.length > 0) {
          await tx.bid.updateMany({
            where: {
              id: { in: losingBids.map((b) => b.id) },
              status: BidStatus.ACTIVE,
            },
            data: {
              status: BidStatus.OUTBID,
              outbidAt: new Date(),
              isWinning: false,
            },
          });
        }

        // 4. Update listing
        await tx.landListing.update({
          where: { id: listingId },
          data: {
            auctionStatus: AuctionStatus.SETTLED,
            status: ListingStatus.CLOSED,
            winningBidId: winningBid.id,
            currentLeaderId: winningBid.farmerId,
          },
        });

        // 5. Create Lease via LeaseService (idempotent, writes LEASE_CREATED event)
        const rent = winningBid.amount.toNumber();
        const durationMonths = listing.minimumLeaseDuration;

        const lease = await LeaseService.createFromAuction(tx, {
          listingId: listing.id,
          landId: listing.landId,
          farmerId: winningBid.farmerId,
          ownerId: listing.ownerId,
          winningBidId: winningBid.id,
          rent,
          durationMonths,
          actorId: winningBid.farmerId,
        });

        // 6. Update Land availability
        await tx.land.update({
          where: { id: listing.landId },
          data: { availabilityStatus: "LEASED" },
        });

        // 7. Audit log (platform-level; LeaseEvent already written by LeaseService)
        await tx.auditLog.create({
          data: {
            userId: winningBid.farmerId,
            action: "AUCTION_SETTLED",
            entity: "LISTING",
            entityId: listingId,
            metadata: {
              winningBidId: winningBid.id,
              leaseId: lease.id,
            },
          },
        });

        return {
          success: true,
          listingId,
          winningBidId: winningBid.id,
          leaseId: lease.id,
          message: "Auction settled - lease created",
        };
      },
      {
        timeout: 15000,
        isolationLevel: "Serializable",
      },
    );
  }

  /**
   * Notify winner + owner after settlement.
   * Must be called AFTER the transaction commits.
   *
   * URLs point at the canonical /leases/:id route that PR 3 introduces.
   */
  static async notifySettlement(result: SettlementResult) {
    if (!result.success || !result.leaseId || !result.winningBidId) return;

    const lease = await prisma.lease.findUnique({
      where: { id: result.leaseId },
      include: {
        land: { select: { title: true } },
        farmer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    if (!lease) return;

    // Notify winner (farmer)
    await createNotification({
      userId: lease.farmerId,
      type: "LEASE",
      title: "🎉 Congratulations! You Won the Auction",
      message: `You won the auction for "${lease.land.title}". A lease agreement has been created. Please review and sign.`,
      entityType: "LEASE",
      entityId: lease.id,
      actionUrl: `/leases/${lease.id}`,
      priority: "HIGH",
    });

    // Notify owner
    await createNotification({
      userId: lease.ownerId,
      type: "LEASE",
      title: "Auction Settled - Lease Created",
      message: `Auction for "${lease.land.title}" has been settled. Winner: ${lease.farmer.name}. Lease is pending signatures.`,
      entityType: "LEASE",
      entityId: lease.id,
      actionUrl: `/leases/${lease.id}`,
      priority: "HIGH",
    });
  }
}