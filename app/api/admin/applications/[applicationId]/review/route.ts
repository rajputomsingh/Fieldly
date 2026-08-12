// app/api/applications/[applicationId]/review/route.ts
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
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔍 Review request:", {
      userId: user.id,
      role: user.role,
      applicationId,
    });

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          include: {
            landowner: {
              include: {
                user: { select: { id: true } },
              },
            },
          },
        },
        farmer: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Check authorization
    const isLandowner = application.land.landowner.user.id === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    console.log("🔍 Auth check:", {
      isLandowner,
      isAdmin,
      landownerUserId: application.land.landowner.user.id,
      userId: user.id,
    });

    if (!isLandowner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to review this application" },
        { status: 403 },
      );
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(application.status)) {
      return NextResponse.json(
        { error: `Application is already ${application.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { status, reviewNotes } = body;

    console.log("🔍 Review action:", { status, reviewNotes });

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: {
          status,
          reviewNotes: reviewNotes || null,
          reviewedAt: new Date(),
        },
      });

      if (status === "APPROVED") {
        const rent =
          application.proposedRent?.toNumber() ??
          application.land.expectedRentMin?.toNumber() ??
          0;

        await tx.lease.create({
          data: {
            landId: application.landId,
            farmerId: application.farmerId,
            ownerId: application.land.landownerId,
            listingId: application.listingId,
            rent,
            startDate: new Date(),
            endDate: new Date(
              Date.now() + application.duration * 30 * 24 * 60 * 60 * 1000,
            ),
            status: "PENDING_SIGNATURE",
            leaseSource: application.listingId ? "AUCTION" : "DIRECT",
            securityDeposit: rent * 2,
            grossContractValue: rent * application.duration,
            platformFee: rent * application.duration * 0.05,
            netOwnerReceivable: rent * application.duration * 0.95,
          },
        });
      }

      if (application.listingId && status === "APPROVED") {
        await tx.landListing.update({
          where: { id: application.listingId },
          data: { status: "CLOSED" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: `APPLICATION_${status}`,
          entity: "Application",
          entityId: applicationId,
          metadata: {
            reviewNotes: reviewNotes || null,
            reviewedBy: isAdmin ? "ADMIN" : "LANDOWNER",
            reviewerName: user.name,
          },
        },
      });

      return app;
    });

    // Send notifications
    try {
      await createNotification({
        userId: application.farmerId,
        type: "APPLICATION",
        title:
          status === "APPROVED"
            ? "✅ Application Approved!"
            : "❌ Application Not Selected",
        message:
          status === "APPROVED"
            ? `Great news! Your application for "${application.land.title}" has been approved.`
            : `Your application for "${application.land.title}" was not accepted.`,
        entityType: "Application",
        entityId: applicationId,
        actionUrl: `/applications/${applicationId}`,
        priority: "HIGH",
      });

      await createNotification({
        userId: application.land.landowner.user.id,
        type: "APPLICATION",
        title: `Application ${status.toLowerCase()}`,
        message: `The application from ${application.farmer.name} for "${application.land.title}" has been ${status.toLowerCase()}${isAdmin ? " by an administrator" : ""}.`,
        entityType: "Application",
        entityId: applicationId,
        priority: "MEDIUM",
      });

      console.log("✅ Notifications sent");
    } catch (notifError) {
      console.error("❌ Notification error:", notifError);
    }

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error) {
    console.error("[APPLICATION_REVIEW] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
