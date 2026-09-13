// app/api/leases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { LeaseService } from "@/lib/services/lease.service";
import { handleError, AppError } from "@/lib/errors";
import { LeaseLifecycleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/leases
 *
 * List leases for the authenticated user.
 * - Farmers see leases where they are the farmer.
 * - Landowners see leases where they are the owner.
 * - Admins see all leases.
 *
 * Query params:
 *   lifecycleStatus?  Filter by LeaseLifecycleStatus
 *   page?             Default 1
 *   limit?            Default 20, max 100
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const actor = await LeaseService.resolveActor(userId);

    const sp = req.nextUrl.searchParams;
    const lifecycleStatusParam = sp.get("lifecycleStatus");
    const page = Math.max(parseInt(sp.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(sp.get("limit") ?? "20", 10) || 20, 1),
      100,
    );

    // Validate lifecycleStatus against the enum if provided.
    let lifecycleStatus: LeaseLifecycleStatus | undefined;
    if (lifecycleStatusParam) {
      const allowed = Object.values(LeaseLifecycleStatus) as string[];
      if (!allowed.includes(lifecycleStatusParam)) {
        throw new AppError(
          `Invalid lifecycleStatus: ${lifecycleStatusParam}`,
          400,
          "INVALID_LIFECYCLE_STATUS",
        );
      }
      lifecycleStatus = lifecycleStatusParam as LeaseLifecycleStatus;
    }

    const result = await LeaseService.listForUser(actor, {
      lifecycleStatus,
      limit,
      offset: (page - 1) * limit,
    });

    return NextResponse.json({
      success: true,
      leases: result.leases,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error, {
      route: "/api/leases",
      method: "GET",
    });
  }
}

/**
 * POST /api/leases
 *
 * Not supported. Leases are created through:
 *   - Auction settlement (AuctionSettlementService)
 *   - Application approval (ApplicationService.reviewApplication)
 *
 * Direct lease creation would bypass authorization and audit rules.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Lease creation is not supported via this endpoint",
      code: "METHOD_NOT_ALLOWED",
      details: {
        hint: "Leases are created by auction settlement or application approval.",
      },
    },
    { status: 405 },
  );
}
