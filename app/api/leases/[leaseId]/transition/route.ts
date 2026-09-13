// app/api/leases/[leaseId]/transition/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { LeaseService } from "@/lib/services/lease.service";
import { handleError, AppError } from "@/lib/errors";
import { LeaseLifecycleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/leases/:leaseId/transition
 *
 * Drive a lease lifecycle transition. The state machine in LeaseService
 * validates that the target status is reachable from the current status
 * and that the actor's role may drive the transition.
 *
 * Body:
 *   { to: LeaseLifecycleStatus, reason?: string }
 *
 * Authorization is enforced by LeaseService.authorize() and by the
 * TRANSITION_ACTORS map. Route-level checks are unnecessary.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { leaseId } = await params;
    const body = await req.json();

    const { to, reason } = body;

    if (!to || typeof to !== "string") {
      throw new AppError(
        "Missing required field: to",
        400,
        "INVALID_INPUT",
      );
    }

    const allowed = Object.values(LeaseLifecycleStatus) as string[];
    if (!allowed.includes(to)) {
      throw new AppError(
        `Invalid target status: ${to}`,
        400,
        "INVALID_TARGET_STATUS",
      );
    }

    const actor = await LeaseService.resolveActor(userId);

    const updated = await LeaseService.transition(
      leaseId,
      to as LeaseLifecycleStatus,
      actor,
      typeof reason === "string" ? reason : undefined,
    );

    return NextResponse.json({
      success: true,
      lease: updated,
    });
  } catch (error) {
    return handleError(error, {
      route: "/api/leases/[leaseId]/transition",
      method: "POST",
    });
  }
}
