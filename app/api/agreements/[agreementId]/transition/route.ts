import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AgreementStatus } from "@prisma/client";

import { LeaseService } from "@/lib/services/lease.service";
import { AgreementService } from "@/lib/services/agreement.service";
import { AppError, handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agreementId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { agreementId } = await params;
    const body = await req.json();
    const to = body?.to;

    if (!to || !Object.values(AgreementStatus).includes(to)) {
      throw new AppError(
        "Invalid agreement status",
        400,
        "INVALID_STATUS",
      );
    }

    const actor = await LeaseService.resolveActor(userId);

    const agreement = await AgreementService.transition(
      agreementId,
      to,
      actor,
    );

    return NextResponse.json({ success: true, agreement });
  } catch (error) {
    return handleError(error);
  }
}   