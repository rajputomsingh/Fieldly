// app/api/admin/applications/[applicationId]/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { ApplicationService } from "@/lib/services/application.service";
import { handleError, AppError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { applicationId } = await params;
    const body = await req.json();
    const { status, reviewNotes } = body;

    if (status !== "APPROVED" && status !== "REJECTED") {
      throw new AppError(
        "Invalid status. Must be APPROVED or REJECTED",
        400,
        "INVALID_STATUS",
      );
    }

    const updatedApplication = await ApplicationService.reviewApplication(
      applicationId,
      admin.id,
      { status, reviewNotes },
    );

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    });
  } catch (error) {
    return handleError(error, {
      route: "/api/admin/applications/[applicationId]/review",
      method: "POST",
    });
  }
}
