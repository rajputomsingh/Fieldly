// lib/services/auction-cron.ts
import { prisma } from "@/lib/prisma";
import { AuctionStatus } from "@prisma/client";
import { AuctionSettlementService } from "./auction-settlement.service";

export async function autoSettleEndedAuctions() {
  // Find all LIVE auctions that have passed endDate.
  const endedAuctions = await prisma.landListing.findMany({
    where: {
      auctionStatus: AuctionStatus.LIVE,
      endDate: { lt: new Date() },
    },
    select: { id: true },
  });

  let settled = 0;
  let skipped = 0;

  for (const auction of endedAuctions) {
    // Atomic conditional update: only one worker can transition LIVE -> CLOSED.
    // If two cron runs, or a cron + admin action, race, only one wins.
    const closed = await prisma.landListing.updateMany({
      where: {
        id: auction.id,
        auctionStatus: AuctionStatus.LIVE,
        endDate: { lt: new Date() },
      },
      data: {
        auctionStatus: AuctionStatus.CLOSED,
      },
    });

    if (closed.count !== 1) {
      // Another worker already transitioned this auction. Skip.
      skipped++;
      continue;
    }

    const result = await AuctionSettlementService.settleAuction(auction.id);
    if (result.success) {
      await AuctionSettlementService.notifySettlement(result);
      settled++;
    }
  }

  return { settled, skipped, examined: endedAuctions.length };
}
