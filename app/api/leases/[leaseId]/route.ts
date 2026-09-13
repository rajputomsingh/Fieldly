// app/api/leases/[leaseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { LeaseService } from "@/lib/services/lease.service";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/leases/:leaseId
 *
 * Returns a lease with related land, farmer, owner, latest agreement,
 * recent events, and payment schedule. Authorized for:
 *   - the farmer on the lease
 *   - the owner on the lease
 *   - any admin
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { leaseId } = await params;

    const actor = await LeaseService.resolveActor(userId);
    const lease = await LeaseService.getById(leaseId, actor);

    return NextResponse.json({
      success: true,
      lease,
    });
  } catch (error) {
    return handleError(error, {
      route: "/api/leases/[leaseId]",
      method: "GET",
    });
  }
}
