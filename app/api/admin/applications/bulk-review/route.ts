// app/api/admin/applications/bulk-review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/actions/notifications/createNotification";
import { LeaseService } from "@/lib/services/lease.service";
import { handleError, AppError } from "@/lib/errors";
import { ApplicationStatus, LeaseSource, Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // 1. Admin authorization gate.
    const admin = await requireAdmin();

    // 2. Parse and validate request.
    const body = await req.json();
    const { applicationIds, action, notes } = body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new AppError("applicationIds must be a non-empty array", 400, "INVALID_INPUT");
    }
    if (action !== "APPROVE" && action !== "REJECT") {
      throw new AppError("action must be APPROVE or REJECT", 400, "INVALID_ACTION");
    }

    // 3. Fetch eligible applications outside the transaction.
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
      throw new AppError("No valid applications found", 400, "NO_VALID_APPLICATIONS");
    }

    // 4. Process in a single transaction. Serializable isolation ensures
    //    that concurrent bulk or single reviews cannot race into duplicate
    //    leases. LeaseService.createFromApplication is idempotent per
    //    (landId, farmerId) while the lease is non-terminal.
    const results = await prisma.$transaction(
      async (tx) => {
        const updated = [];

        for (const app of applications) {
          const targetStatus =
            action === "APPROVE"
              ? ApplicationStatus.APPROVED
              : ApplicationStatus.REJECTED;

          const updatedApp = await tx.application.update({
            where: { id: app.id },
            data: {
              status: targetStatus,
              reviewNotes: notes ?? null,
              reviewedAt: new Date(),
            },
          });

          let leaseId: string | null = null;

          if (action === "APPROVE") {
            const rent =
              app.proposedRent?.toNumber() ??
              app.land.expectedRentMin?.toNumber() ??
              0;

            const lease = await LeaseService.createFromApplication(tx, {
              applicationId: app.id,
              landId: app.landId,
              farmerId: app.farmerId,
              ownerId: app.land.landowner.user.id,
              listingId: app.listingId,
              rent,
              durationMonths: app.duration,
              source: app.listingId ? LeaseSource.AUCTION : LeaseSource.DIRECT,
              actorId: admin.id,
            });

            leaseId = lease.id;

            if (app.listingId) {
              await tx.landListing.update({
                where: { id: app.listingId },
                data: { status: "CLOSED" },
              });
            }
          }

          await tx.auditLog.create({
            data: {
              userId: admin.id,
              action: `APPLICATION_${targetStatus}`,
              entity: "Application",
              entityId: app.id,
              metadata: {
                reviewNotes: notes ?? null,
                bulkAction: true,
                reviewedBy: "ADMIN",
                leaseCreated: leaseId !== null,
                leaseId,
              } as Prisma.InputJsonValue,
            },
          });

          updated.push(updatedApp);
        }

        return updated;
      },
      {
        timeout: 15000,
        isolationLevel: "Serializable",
      },
    );

    // 5. Notifications fire after the transaction commits. Non-blocking.
    Promise.allSettled(
      applications.flatMap((app) => [
        createNotification({
          userId: app.farmerId,
          type: "APPLICATION",
          title:
            action === "APPROVE"
              ? "Application Approved"
              : "Application Not Selected",
          message:
            action === "APPROVE"
              ? `Great news! Your application for "${app.land.title}" has been approved.`
              : `Your application for "${app.land.title}" was not accepted.`,
          entityType: "Application",
          entityId: app.id,
          actionUrl: `/applications/${app.id}`,
          priority: "HIGH",
        }).catch((err) => console.error("Failed to notify farmer:", err)),

        createNotification({
          userId: app.land.landowner.user.id,
          type: "APPLICATION",
          title: `Application ${action === "APPROVE" ? "Approved" : "Rejected"}`,
          message: `The application from ${app.farmer.name} for "${app.land.title}" has been ${
            action === "APPROVE" ? "approved" : "rejected"
          } by an administrator.`,
          entityType: "Application",
          entityId: app.id,
          actionUrl: `/applications/${app.id}`,
          priority: "MEDIUM",
        }).catch((err) => console.error("Failed to notify landowner:", err)),
      ]),
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      applications: results.map((a) => ({ id: a.id, status: a.status })),
    });
  } catch (error) {
    return handleError(error, {
      route: "/api/admin/applications/bulk-review",
      method: "POST",
    });
  }
}
