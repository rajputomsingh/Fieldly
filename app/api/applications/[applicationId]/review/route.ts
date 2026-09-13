// app/api/applications/[applicationId]/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { reviewApplicationSchema } from "@/lib/validations/application.schema";
import { ApplicationService } from "@/lib/services/application.service";
import { handleError, AppError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { applicationId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const body = await req.json();

    const validated = reviewApplicationSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError(
        "Validation failed",
        400,
        "VALIDATION_ERROR",
        { issues: validated.error.issues },
      );
    }

    const { status, reviewNotes } = validated.data;

    // Single delegation — ApplicationService owns authorization,
    // lease creation, audit logging, and notification.
    const updatedApplication = await ApplicationService.reviewApplication(
      applicationId,
      user.id,
      { status, reviewNotes },
    );

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    });
  } catch (error) {
    return handleError(error, {
      route: "/api/applications/[applicationId]/review",
      method: "POST",
    });
  }
}