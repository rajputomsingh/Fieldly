// lib/services/auction-cron.ts
import { prisma } from "@/lib/prisma";
import { AuctionStatus } from "@prisma/client";
import { AuctionSettlementService } from "./auction-settlement.service";

export async function autoSettleEndedAuctions() {
  // Find all LIVE auctions that have passed endDate
  const endedAuctions = await prisma.landListing.findMany({
    where: {
      auctionStatus: AuctionStatus.LIVE,
      endDate: { lt: new Date() },
    },
    select: { id: true },
  });

  for (const auction of endedAuctions) {
    // Mark as CLOSED first
    await prisma.landListing.update({
      where: { id: auction.id },
      data: { auctionStatus: AuctionStatus.CLOSED },
    });

    // Then settle
    const result = await AuctionSettlementService.settleAuction(auction.id);
    if (result.success) {
      await AuctionSettlementService.notifySettlement(result);
    }
  }

  return { settled: endedAuctions.length };
}