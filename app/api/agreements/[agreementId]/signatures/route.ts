import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { LeaseService } from "@/lib/services/lease.service";
import { SignatureService } from "@/lib/services/signature.service";
import { AppError, handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agreementId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { agreementId } = await params;
    const actor = await LeaseService.resolveActor(userId);

    const signatures = await SignatureService.getSignatures(
      agreementId,
      actor,
    );

    return NextResponse.json({ success: true, signatures });
  } catch (error) {
    return handleError(error);
  }
}