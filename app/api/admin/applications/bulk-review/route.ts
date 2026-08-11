// app/api/admin/applications/bulk-review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/actions/notifications/createNotification";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, id: true, name: true },
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { applicationIds, action, notes } = body;

    if (!applicationIds?.length || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // First, fetch applications outside transaction
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
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

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "No valid applications found" },
        { status: 400 },
      );
    }

    // Shorter transaction - only database updates
    const results = await prisma.$transaction(
      async (tx) => {
        const updated = [];

        for (const app of applications) {
          // Update application
          const updatedApp = await tx.application.update({
            where: { id: app.id },
            data: {
              status: action === "APPROVE" ? "APPROVED" : "REJECTED",
              reviewNotes: notes || null,
              reviewedAt: new Date(),
            },
          });

          if (action === "APPROVE") {
            const rent =
              app.proposedRent?.toNumber() ??
              app.land.expectedRentMin?.toNumber() ??
              0;

            // Create lease
            await tx.lease.create({
              data: {
                landId: app.landId,
                farmerId: app.farmerId,
                ownerId: app.land.landowner.user.id,
                listingId: app.listingId,
                rent,
                startDate: new Date(),
                endDate: new Date(
                  Date.now() + app.duration * 30 * 24 * 60 * 60 * 1000,
                ),
                status: "PENDING_SIGNATURE",
                leaseSource: app.listingId ? "AUCTION" : "DIRECT",
                securityDeposit: rent * 2,
                grossContractValue: rent * app.duration,
                platformFee: rent * app.duration * 0.05,
                netOwnerReceivable: rent * app.duration * 0.95,
              },
            });

            // Update listing if applicable
            if (app.listingId) {
              await tx.landListing.update({
                where: { id: app.listingId },
                data: { status: "CLOSED" },
              });
            }
          }

          // Create audit log
          await tx.auditLog.create({
            data: {
              userId: admin.id,
              action: `APPLICATION_${action === "APPROVE" ? "APPROVED" : "REJECTED"}`,
              entity: "Application",
              entityId: app.id,
              metadata: {
                reviewNotes: notes,
                bulkAction: true,
                reviewedBy: "ADMIN",
              },
            },
          });

          updated.push(updatedApp);
        }

        return updated;
      },
      {
        timeout: 15000, // Increase timeout to 15 seconds
      },
    );

    // Send notifications OUTSIDE the transaction (non-blocking)
    Promise.allSettled(
      applications.flatMap((app) => [
        // Notify farmer
        createNotification({
          userId: app.farmerId,
          type: "APPLICATION",
          title:
            action === "APPROVE"
              ? "✅ Application Approved!"
              : "❌ Application Not Selected",
          message:
            action === "APPROVE"
              ? `Great news! Your application for "${app.land.title}" has been approved.`
              : `Your application for "${app.land.title}" was not accepted.`,
          entityType: "Application",
          entityId: app.id,
          actionUrl: `/applications/${app.id}`,
          priority: "HIGH",
        }).catch((err) => console.error("Failed to notify farmer:", err)),

        // Notify landowner
        createNotification({
          userId: app.land.landowner.user.id,
          type: "APPLICATION",
          title: `Application ${action === "APPROVE" ? "Approved" : "Rejected"}`,
          message: `The application from ${app.farmer.name} for "${app.land.title}" has been ${action === "APPROVE" ? "approved" : "rejected"} by an administrator.`,
          entityType: "Application",
          entityId: app.id,
          actionUrl: `/applications/${app.id}`,
          priority: "MEDIUM",
        }).catch((err) => console.error("Failed to notify landowner:", err)),
      ]),
    ).then((results) => {
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      console.log(`✅ Sent ${succeeded} notifications`);
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      applications: results.map((a) => ({ id: a.id, status: a.status })),
    });
  } catch (error) {
    console.error("[ADMIN_BULK_REVIEW]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
