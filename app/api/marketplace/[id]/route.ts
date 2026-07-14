// GET /api/marketplace/[id] - Listing Detail
import { NextRequest } from "next/server";
import { marketplaceService } from "@/lib/marketplace/service";
import { responses } from "@/lib/marketplace/responses";
import { logger } from "@/lib/marketplace/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId") || undefined;
    const listing = await marketplaceService.getListing(id, userId);
    if (!listing) return responses.notFound("Listing not found");
    return responses.success({ listing });
  } catch (error) {
    logger.error("Listing detail API error", error as Error);
    return responses.serverError("Failed to fetch listing details");
  }
}
