// app/api/applications/[applicationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/actions/notifications/createNotification";

/**
 * GET /api/applications/[applicationId]
 * Get a single application by ID
 */
export async function GET(
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

    // Fixed: landowner is LandownerProfile, need to include user
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
                    email: true,
                    imageUrl: true,
                    phone: true,
                    state: true,
                    district: true,
                    bio: true,
                  },
                },
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                url: true,
                caption: true,
              },
            },
            soilReports: {
              take: 1,
              orderBy: { testedAt: "desc" },
              select: {
                id: true,
                ph: true,
                moisture: true,
                nutrients: true,
                reportUrl: true,
                testedAt: true,
              },
            },
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            phone: true,
            state: true,
            district: true,
            bio: true,
            farmerProfile: {
              select: {
                primaryCrops: true,
                farmingExperience: true,
                farmingType: true,
                isVerified: true,
                equipmentAccess: true,
                irrigationNeeded: true,
                requiredLandSize: true,
              },
            },
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            description: true,
            basePrice: true,
            status: true,
            listingType: true,
            startDate: true,
            endDate: true,
            totalBids: true,
            highestBid: true,
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

    // Authorization check
    const isFarmer = application.farmerId === user.id;
    const isLandowner = application.land.landowner.user.id === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isFarmer && !isLandowner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to view this application" },
        { status: 403 },
      );
    }

    // Mark as viewed (update status to UNDER_REVIEW)
    if (isLandowner && application.status === "PENDING") {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "UNDER_REVIEW" },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "APPLICATION_VIEWED",
          entity: "Application",
          entityId: applicationId,
        },
      });
    }

    // Sanitize response based on role
    const sanitizedApplication = {
      ...application,
      land: {
        ...application.land,
        landowner: {
          ...application.land.landowner,
          user: {
            ...application.land.landowner.user,
            // Only show contact info to farmer who applied or admin
            email:
              isFarmer || isAdmin
                ? application.land.landowner.user.email
                : undefined,
            phone:
              isFarmer || isAdmin
                ? application.land.landowner.user.phone
                : undefined,
          },
        },
      },
      farmer: {
        ...application.farmer,
        // Only show contact info to landowner or admin
        email: isLandowner || isAdmin ? application.farmer.email : undefined,
        phone: isLandowner || isAdmin ? application.farmer.phone : undefined,
      },
    };

    return NextResponse.json({
      application: sanitizedApplication,
      permissions: {
        canEdit: isFarmer && application.status === "PENDING",
        canWithdraw:
          isFarmer && ["PENDING", "UNDER_REVIEW"].includes(application.status),
        canReview:
          isLandowner &&
          ["PENDING", "UNDER_REVIEW"].includes(application.status),
        canDelete: (isFarmer && application.status === "PENDING") || isAdmin,
        isAdmin,
      },
    });
  } catch (error) {
    console.error("[APPLICATION_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/applications/[applicationId]
 * Update an application (farmer only, only pending applications)
 */
export async function PATCH(
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

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          select: {
            title: true,
            minLeaseDuration: true,
            maxLeaseDuration: true,
            expectedRentMin: true,
            expectedRentMax: true,
            landowner: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
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

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (application.farmerId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "You can only update your own applications" },
        { status: 403 },
      );
    }

    if (application.status !== "PENDING" && !isAdmin) {
      return NextResponse.json(
        { error: "Only pending applications can be updated" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const allowedFields = ["proposedRent", "duration", "cropPlan", "message"];
    const updates: Record<string, unknown> = {};
    const validationErrors: string[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "duration") {
          const duration = parseInt(body[field]);
          if (
            duration < application.land.minLeaseDuration ||
            duration > application.land.maxLeaseDuration
          ) {
            validationErrors.push(
              `Duration must be between ${application.land.minLeaseDuration} and ${application.land.maxLeaseDuration} months`,
            );
          } else {
            updates.duration = duration;
          }
        } else if (field === "proposedRent") {
          const rent = parseFloat(body[field]);
          if (
            application.land.expectedRentMin &&
            rent < application.land.expectedRentMin?.toNumber()
          ) {
            validationErrors.push(
              `Rent cannot be below minimum expected (₹${application.land.expectedRentMin})`,
            );
          } else if (
            application.land.expectedRentMax &&
            rent > application.land.expectedRentMax?.toNumber()
          ) {
            validationErrors.push(
              `Rent cannot exceed maximum expected (₹${application.land.expectedRentMax})`,
            );
          } else {
            updates.proposedRent = rent;
          }
        } else if (field === "cropPlan" || field === "message") {
          const text = body[field]?.trim() || "";
          if (text.length > 2000) {
            validationErrors.push(`${field} must be less than 2000 characters`);
          } else {
            const contactPatterns = {
              phone: /(\+91[-\s]?)?[6-9]\d{9}|\d{10,}/g,
              email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            };

            let hasContactInfo = false;
            for (const pattern of Object.values(contactPatterns)) {
              if (pattern.test(text)) {
                hasContactInfo = true;
                break;
              }
            }

            if (hasContactInfo) {
              validationErrors.push(
                `${field} cannot contain contact information (phone, email, etc.)`,
              );
            } else {
              updates[field] = text;
            }
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 },
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "APPLICATION_UPDATED",
          entity: "Application",
          entityId: applicationId,
          metadata: {
            updatedFields: Object.keys(updates),
          },
        },
      });

      return updated;
    });

    // Notify landowner of significant changes
    if (updates.proposedRent || updates.duration) {
      await createNotification({
        userId: application.land.landowner.user.id,
        type: "APPLICATION",
        title: "Application Updated",
        message: `${user.name} has updated their application for "${application.land.title}".`,
        entityType: "Application",
        entityId: applicationId,
        actionUrl: `/landowner/applications/${applicationId}`,
        priority: "MEDIUM",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("[APPLICATION_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/applications/[applicationId]
 * Delete an application (farmer only, only pending applications)
 */
export async function DELETE(
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          select: {
            title: true,
            landowner: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
          },
        },
        listing: {
          select: { id: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (application.farmerId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own applications" },
        { status: 403 },
      );
    }

    if (application.status !== "PENDING" && !isAdmin) {
      return NextResponse.json(
        { error: "Only pending applications can be deleted" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.delete({
        where: { id: applicationId },
      });

      if (application.listingId) {
        await tx.landListing.update({
          where: { id: application.listingId },
          data: {
            applicationCount: {
              decrement: 1,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "APPLICATION_DELETED",
          entity: "Application",
          entityId: applicationId,
          metadata: {
            landId: application.landId,
            listingId: application.listingId,
            deletedBy: user.id,
            deletedByRole: isAdmin ? "ADMIN" : "FARMER",
          },
        },
      });
    });

    if (isAdmin && application.farmerId !== user.id) {
      await createNotification({
        userId: application.land.landowner.user.id,
        type: "APPLICATION",
        title: "Application Removed",
        message: `An application for "${application.land.title}" has been removed by an administrator.`,
        entityType: "Application",
        entityId: applicationId,
        priority: "MEDIUM",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("[APPLICATION_DELETE]", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
