// POST /api/marketplace/[id]/bids - Place a Bid
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { marketplaceService } from "@/lib/marketplace/service";
import { BidSchema } from "@/lib/marketplace/validation";
import { responses } from "@/lib/marketplace/responses";
import { logger } from "@/lib/marketplace/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. SECURITY (GHSA-6pch): Require authentication
    const { userId } = await auth();
    if (!userId) {
      return responses.unauthorized();
    }

    // 2. SECURITY (GHSA-6pch): Look up the user and verify role
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "FARMER") {
      return responses.forbidden("Only farmers can place bids");
    }

    const { id } = await params;
    const body = await request.json();

    // 3. SECURITY (GHSA-6pch): BidSchema no longer contains farmerId,
    // so any farmerId sent by the client is safely ignored.
    const validation = BidSchema.safeParse(body);
    if (!validation.success) {
      return responses.badRequest("Invalid bid data", validation.error.issues);
    }

    // 4. Force the farmerId to be the authenticated user's ID
    const result = await marketplaceService.placeBid(id, {
      ...validation.data,
      amount: Number(validation.data.amount),
      farmerId: user.id, // <--- Secure identity injection
    });

    return responses.created(result);
  } catch (error) {
    logger.error("Place bid API error", error as Error);
    if (error instanceof Error) {
      if (error.message.includes("Transaction failed")) {
        return responses.conflict("Transaction failed. Please try again.");
      }
      return responses.badRequest(error.message);
    }
    return responses.serverError("Failed to place bid");
  }
}
