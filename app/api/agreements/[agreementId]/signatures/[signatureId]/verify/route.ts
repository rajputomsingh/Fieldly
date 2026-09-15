import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { SignatureService } from "@/lib/services/signature.service";
import { AppError, handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      agreementId: string;
      signatureId: string;
    }>;
  },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { signatureId } = await params;

    const result = await SignatureService.verify(signatureId);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}