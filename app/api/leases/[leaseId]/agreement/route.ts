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

    const agreement = await AgreementService.getByLeaseId(
      leaseId,
      actor,
    );

    return NextResponse.json({ success: true, agreement });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
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

    const agreement = await AgreementService.createFromLease(
      leaseId,
      actor,
    );

    const generated = await AgreementService.generateDocument(
      agreement.id,
      actor,
    );

    return NextResponse.json(
      { success: true, agreement: generated },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}