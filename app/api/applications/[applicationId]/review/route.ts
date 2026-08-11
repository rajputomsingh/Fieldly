// app/api/applications/[applicationId]/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { reviewApplicationSchema } from "@/lib/validations/application.schema";
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

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    // Fixed: landowner is LandownerProfile, need to include user to get name
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          include: {
            landowner: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Access landowner's user id for comparison
    const isLandowner = application.land.landowner.user.id === user.id;

    if (!isLandowner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the landowner can review this application" },
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

    const validated = reviewApplicationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validated.error.issues,
        },
        { status: 400 },
      );
    }

    const { status, reviewNotes } = validated.data;

    const result = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: {
          status,
          reviewNotes: reviewNotes || null,
          reviewedAt: new Date(),
        },
      });

      let lease = null;
      if (status === "APPROVED") {
        const rent =
          application.proposedRent?.toNumber() ??
          application.land.expectedRentMin?.toNumber() ??
          0;
        lease = await tx.lease.create({
          data: {
            landId: application.landId,
            farmerId: application.farmerId,
            ownerId: user.id, // Use current user's id as owner
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
          data: {
            status: "CLOSED",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: `APPLICATION_${status}`,
          entity: "Application",
          entityId: applicationId,
          metadata: {
            reviewNotes: reviewNotes || undefined,
            leaseCreated: !!lease,
            leaseId: lease?.id,
          },
        },
      });

      return { application: updatedApplication, lease };
    });

    // Send notification to farmer
    await createNotification({
      userId: application.farmerId,
      type: "APPLICATION",
      title: `Application ${status.toLowerCase()}`,
      message:
        status === "APPROVED"
          ? `Great news! Your application for "${application.land.title}" has been approved. Please review and sign the lease agreement.`
          : `Your application for "${application.land.title}" was not accepted at this time.`,
      entityType: "Application",
      entityId: applicationId,
      actionUrl: `/applications/${applicationId}`,
      priority: "MEDIUM",
    });

    // Send confirmation to landowner
    await createNotification({
      userId: user.id,
      type: "APPLICATION",
      title: `Application ${status.toLowerCase()}`,
      message: `You have ${status.toLowerCase()} the application from ${application.farmer.name} for "${application.land.title}".`,
      entityType: "Application",
      entityId: applicationId,
      priority: "MEDIUM",
    });

    return NextResponse.json({
      success: true,
      application: result.application,
      lease: result.lease,
    });
  } catch (error) {
    console.error("[APPLICATION_REVIEW]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
