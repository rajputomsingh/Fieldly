import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { LeaseService } from "@/lib/services/lease.service";
import { SignatureService } from "@/lib/services/signature.service";
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
    const actor = await LeaseService.resolveActor(userId);

    const result = await SignatureService.sign(agreementId, {
      id: actor.id,
      role: actor.role,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}