// app/api/applications/[applicationId]/withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/actions/notifications/createNotification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          include: {
            landowner: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        farmer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const isFarmer = application.farmerId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isFarmer && !isAdmin) {
      return NextResponse.json(
        { error: "You can only withdraw your own applications" },
        { status: 403 },
      );
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(application.status)) {
      return NextResponse.json(
        {
          error: `Cannot withdraw application with status: ${application.status}`,
        },
        { status: 400 },
      );
    }

    // Use updateMany to avoid unique constraint on (landId, farmerId, status)
    await prisma.$transaction(async (tx) => {
      const updated = await tx.application.updateMany({
        where: {
          id: applicationId,
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
        data: {
          status: "WITHDRAWN",
          updatedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error(
          "Application could not be withdrawn - status may have changed",
        );
      }

      if (application.listingId) {
        await tx.landListing.update({
          where: { id: application.listingId },
          data: { applicationCount: { decrement: 1 } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "APPLICATION_WITHDRAWN",
          entity: "Application",
          entityId: applicationId,
          metadata: {
            landId: application.landId,
            previousStatus: application.status,
            withdrawnBy: user.id,
            withdrawnByRole: isAdmin ? "ADMIN" : "FARMER",
          },
        },
      });

      return updated;
    });

    // Notify landowner
    try {
      await createNotification({
        userId: application.land.landowner.user.id,
        type: "APPLICATION",
        title: "Application Withdrawn",
        message: `${application.farmer.name} has withdrawn their application for "${application.land.title}".`,
        entityType: "Application",
        entityId: applicationId,
        actionUrl: "/landowner/applications",
        priority: "MEDIUM",
      });
    } catch (notifError) {
      console.error("Failed to notify landowner:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: "Application withdrawn successfully",
      application: {
        id: applicationId,
        status: "WITHDRAWN",
        landTitle: application.land.title,
        withdrawnAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[APPLICATION_WITHDRAW]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
