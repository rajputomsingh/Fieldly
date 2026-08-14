// lib/services/auction-settlement.service.ts
import { prisma } from "@/lib/prisma";
import { AuctionStatus, BidStatus, LeaseLifecycleStatus, LeaseSource, ListingStatus } from "@prisma/client";
import { createNotification } from "@/actions/notifications/createNotification";

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
   * 4. Create Lease from winning bid
   * 5. Notify winner + owner
   * 6. Log audit events
   */
  static async settleAuction(listingId: string): Promise<SettlementResult> {
    return prisma.$transaction(async (tx) => {
      // 1. Get listing with active bids
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
        return { success: false, listingId, winningBidId: null, leaseId: null, message: "Listing not found" };
      }

      if (listing.auctionStatus !== AuctionStatus.CLOSED) {
        return { success: false, listingId, winningBidId: null, leaseId: null, message: `Auction is ${listing.auctionStatus}, not CLOSED` };
      }

      // 2. Select highest valid bid
      const winningBid = listing.bids[0];
      if (!winningBid) {
        // No bids - mark auction FAILED
        await tx.landListing.update({
          where: { id: listingId },
          data: { auctionStatus: AuctionStatus.FAILED, status: ListingStatus.CANCELLED },
        });
        return { success: false, listingId, winningBidId: null, leaseId: null, message: "No valid bids - auction failed" };
      }

      // 3. Mark winner + outbid losers
      await tx.bid.update({
        where: { id: winningBid.id },
        data: { status: BidStatus.ACCEPTED, isWinning: true },
      });

      const losingBids = listing.bids.filter(b => b.id !== winningBid.id);
      if (losingBids.length > 0) {
        await tx.bid.updateMany({
          where: { id: { in: losingBids.map(b => b.id) }, status: BidStatus.ACTIVE },
          data: { status: BidStatus.OUTBID, outbidAt: new Date(), isWinning: false },
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

      // 5. Create Lease
      const lease = await tx.lease.create({
        data: {
          landId: listing.landId,
          farmerId: winningBid.farmerId,
          ownerId: listing.ownerId,
          listingId: listing.id,
          rent: winningBid.amount,
          startDate: new Date(),
          endDate: new Date(Date.now() + listing.minimumLeaseDuration * 30 * 24 * 60 * 60 * 1000),
          status: "DRAFT",
          lifecycleStatus: LeaseLifecycleStatus.DRAFT,
          paymentStatus: "PENDING",
          leaseSource: LeaseSource.AUCTION,
          securityDeposit: winningBid.amount.toNumber() * 2,
          grossContractValue: winningBid.amount.toNumber() * listing.minimumLeaseDuration,
          platformFee: winningBid.amount.toNumber() * listing.minimumLeaseDuration * 0.05,
          netOwnerReceivable: winningBid.amount.toNumber() * listing.minimumLeaseDuration * 0.95,
        },
      });

      // 6. Update Land availability
      await tx.land.update({
        where: { id: listing.landId },
        data: { availabilityStatus: "LEASED" },
      });

      // 7. Create audit logs
      await tx.auditLog.create({
        data: {
          userId: winningBid.farmerId,
          action: "AUCTION_SETTLED",
          entity: "LISTING",
          entityId: listingId,
          metadata: { winningBidId: winningBid.id, leaseId: lease.id },
        },
      });

      await tx.leaseEvent.create({
        data: {
          leaseId: lease.id,
          type: "LEASE_CREATED",
          metadata: { source: "AUCTION", listingId, winningBidId: winningBid.id },
        },
      });

      return {
        success: true,
        listingId,
        winningBidId: winningBid.id,
        leaseId: lease.id,
        message: "Auction settled - lease created",
      };
    }, {
      timeout: 15000,
      isolationLevel: "Serializable",
    });
  }

  /**
   * Notify winner + owner after settlement
   * Call this AFTER settleAuction succeeds
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

    // Notify winner
    await createNotification({
      userId: lease.farmerId,
      type: "LEASE",
      title: "🎉 Congratulations! You Won the Auction",
      message: `You won the auction for "${lease.land.title}". A lease agreement has been created. Please review and sign.`,
      entityType: "LEASE",
      entityId: lease.id,
      actionUrl: `/applications/${lease.id}`,
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
      actionUrl: `/landowner/leases/${lease.id}`,
      priority: "HIGH",
    });
  }
}