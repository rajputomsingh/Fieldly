import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { LeaseService } from "@/lib/services/lease.service";
import { AgreementService } from "@/lib/services/agreement.service";
import { AppError, handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

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

    const versions = await AgreementService.getVersionHistory(
      leaseId,
      actor,
    );

    return NextResponse.json({ success: true, versions });
  } catch (error) {
    return handleError(error);
  }
}