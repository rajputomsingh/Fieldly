// app/api/marketplace/[id]/settle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { AuctionSettlementService } from "@/lib/services/auction-settlement.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await AuctionSettlementService.settleAuction(id);

    if (result.success) {
      await AuctionSettlementService.notifySettlement(result);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SETTLE_AUCTION]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Settlement failed" },
      { status: 500 },
    );
  }
}
