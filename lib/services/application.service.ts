// lib/services/application.service.ts
import { prisma } from "@/lib/prisma";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { createNotification } from "@/actions/notifications/createNotification";
import { AppError } from "@/lib/errors";

// ============================================
// CONTACT INFORMATION BLOCKLIST
// ============================================
const BLOCKED_PATTERNS = [
  // Email symbols and domains
  "@",
  "gmail",
  "yahoo",
  "outlook",
  "hotmail",
  "icloud",
  "proton",
  "email",
  "mail",
  ".com",
  ".in",
  ".org",
  ".net",
  ".co",
  ".io",
  ".uk",
  ".us",
  ".dev",

  // Contact keywords
  "contact",
  "call",
  "text",
  "reach",
  "ping",
  "dm",
  "message me",
  "whatsapp",
  "telegram",
  "signal",
  "instagram",
  "facebook",
  "twitter",
  "linkedin",

  // Phone indicators
  "phone",
  "mobile",
  "number",
  "cell",
  "+91",
  "+1",
  "+44",

  // Obfuscation attempts
  "[at]",
  "[dot]",
  "(at)",
  "(dot)",
  " at ",
  " dot ",
];

function hasContactInfo(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  if (BLOCKED_PATTERNS.some((p) => lower.includes(p))) return true;

  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly.length >= 10) return true;

  const spaceless = lower.replace(/\s+/g, "");
  if (spaceless.includes("@") && spaceless.includes(".com")) return true;

  return false;
}

// ============================================
// TYPES
// ============================================
interface SanitizedApplicationResponse {
  id: string;
  status: ApplicationStatus;
  proposedRent: number | null;
  duration: number;
  cropPlan: string | null;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  landId: string;
  farmerId: string;
  listingId: string | null;
  land: {
    id: string;
    title: string;
    size: number;
    landType: string;
    village: string | null;
    district: string | null;
    state: string | null;
    landowner: {
      id: string;
      name: string;
      imageUrl: string | null;
      state: string | null;
      district: string | null;
      email?: string;
      phone?: string | null;
    };
    images?: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
  };
  farmer: {
    id: string;
    name: string;
    imageUrl: string | null;
    state: string | null;
    district: string | null;
    email?: string;
    phone?: string | null;
    farmerProfile?: {
      primaryCrops: string[];
      farmingExperience: number;
      farmingType: string | null;
      isVerified: boolean;
    } | null;
  };
  listing?: {
    id: string;
    title: string;
    basePrice: number;
    status: string;
    listingType: string;
  } | null;
}

interface SanitizePermissions {
  isFarmer?: boolean;
  isLandowner?: boolean;
  isAdmin?: boolean;
}

// ============================================
// APPLICATION SERVICE CLASS
// ============================================
export class ApplicationService {
  /**
   * Safely convert Prisma Decimal or number to plain number
   */
  private static toNumberSafe(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value === "number") return value;
    if (typeof value === "object" && "toNumber" in value) {
      return (value as { toNumber: () => number }).toNumber();
    }
    if (typeof value === "string") return parseFloat(value);
    return null;
  }

  /**
   * Create a new application
   */
  static async createApplication(
    farmerId: string,
    data: {
      landId: string;
      listingId?: string;
      proposedRent?: number;
      duration: number;
      cropPlan?: string;
      message?: string;
    },
  ) {
    if (hasContactInfo(data.cropPlan || "")) {
      throw new AppError(
        "Crop plan contains contact information. Please remove it.",
        400,
      );
    }

    if (hasContactInfo(data.message || "")) {
      throw new AppError(
        "Message contains contact information. Please remove it.",
        400,
      );
    }

    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true },
    });

    if (!farmer) throw new AppError("User not found", 404);
    if (!farmer.isOnboarded)
      throw new AppError("Complete onboarding before applying", 400);

    const land = await prisma.land.findUnique({
      where: { id: data.landId },
      include: {
        landowner: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!land) throw new AppError("Land not found", 404);
    if (!land.isActive || land.isArchived)
      throw new AppError("This land is not available", 400);

    const landownerUserId = land.landowner.user.id;

    const existingApplication = await prisma.application.findFirst({
      where: {
        landId: data.landId,
        farmerId,
        status: { in: ["PENDING", "UNDER_REVIEW", "APPROVED"] },
      },
    });

    if (existingApplication)
      throw new AppError(
        "You already have an active application for this land",
        400,
      );

    if (
      data.duration < land.minLeaseDuration ||
      data.duration > land.maxLeaseDuration
    ) {
      throw new AppError(
        `Lease duration must be between ${land.minLeaseDuration} and ${land.maxLeaseDuration} months`,
        400,
      );
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          landId: data.landId,
          farmerId,
          listingId: data.listingId,
          proposedRent: data.proposedRent,
          duration: data.duration,
          cropPlan: data.cropPlan,
          message: data.message,
          status: ApplicationStatus.PENDING,
        },
        include: {
          land: {
            include: {
              landowner: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          farmer: true,
        },
      });

      if (data.listingId) {
        await tx.landListing.update({
          where: { id: data.listingId },
          data: { applicationCount: { increment: 1 } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: farmerId,
          action: "APPLICATION_CREATED",
          entity: "Application",
          entityId: app.id,
          metadata: { landId: data.landId, duration: data.duration },
        },
      });

      return app;
    });

    try {
      await createNotification({
        userId: landownerUserId,
        type: "APPLICATION",
        title: "📋 New Lease Application Received",
        message: `${farmer.name} has applied to lease "${land.title}".`,
        entityType: "Application",
        entityId: application.id,
        actionUrl: `/applications/${application.id}`,
        priority: "HIGH",
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return application;
  }

  /**
   * Review application (approve/reject)
   */
  static async reviewApplication(
    applicationId: string,
    reviewerId: string,
    data: { status: "APPROVED" | "REJECTED"; reviewNotes?: string },
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          include: {
            landowner: {
              include: { user: { select: { id: true } } },
            },
          },
        },
        farmer: true,
      },
    });

    if (!application) throw new AppError("Application not found", 404);

    const landownerUserId = application.land.landowner.user.id;
    if (landownerUserId !== reviewerId) throw new AppError("Unauthorized", 403);

    if (!["PENDING", "UNDER_REVIEW"].includes(application.status)) {
      throw new AppError(
        `Application is already ${application.status.toLowerCase()}`,
        400,
      );
    }

    if (hasContactInfo(data.reviewNotes || "")) {
      throw new AppError(
        "Review notes cannot contain contact information",
        400,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: data.status,
          reviewNotes: data.reviewNotes,
          reviewedAt: new Date(),
        },
      });

      if (data.status === "APPROVED") {
        const rent =
          this.toNumberSafe(application.proposedRent) ??
          this.toNumberSafe(application.land.expectedRentMin) ??
          0;

        await tx.lease.create({
          data: {
            landId: application.landId,
            farmerId: application.farmerId,
            ownerId: reviewerId,
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

      if (application.listingId && data.status === "APPROVED") {
        await tx.landListing.update({
          where: { id: application.listingId },
          data: { status: "CLOSED" },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: `APPLICATION_${data.status}`,
          entity: "Application",
          entityId: applicationId,
          metadata: { notes: data.reviewNotes },
        },
      });

      return app;
    });

    try {
      await createNotification({
        userId: application.farmerId,
        type: "APPLICATION",
        title:
          data.status === "APPROVED"
            ? "✅ Application Approved!"
            : "❌ Application Not Selected",
        message:
          data.status === "APPROVED"
            ? `Great news! Your application for "${application.land.title}" has been approved.`
            : `Your application for "${application.land.title}" was not accepted.`,
        entityType: "Application",
        entityId: applicationId,
        actionUrl: `/applications/${applicationId}`,
        priority: "HIGH",
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return updated;
  }

  /**
   * Withdraw application (farmer only)
   */
  static async withdrawApplication(applicationId: string, farmerId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: {
          include: {
            landowner: {
              include: { user: { select: { id: true } } },
            },
          },
        },
        farmer: true,
      },
    });

    if (!application) throw new AppError("Application not found", 404);
    if (application.farmerId !== farmerId)
      throw new AppError("Unauthorized", 403);
    if (!["PENDING", "UNDER_REVIEW"].includes(application.status))
      throw new AppError("Application cannot be withdrawn", 400);

    await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: {
          id: applicationId,
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
        data: { status: "WITHDRAWN" },
      });

      if (application.listingId) {
        await tx.landListing.update({
          where: { id: application.listingId },
          data: { applicationCount: { decrement: 1 } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: farmerId,
          action: "APPLICATION_WITHDRAWN",
          entity: "Application",
          entityId: applicationId,
        },
      });
    });

    try {
      await createNotification({
        userId: application.land.landowner.user.id,
        type: "APPLICATION",
        title: "↩️ Application Withdrawn",
        message: `${application.farmer.name} has withdrawn their application.`,
        entityType: "Application",
        entityId: applicationId,
        priority: "MEDIUM",
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  /**
   * Get applications with filters
   */
  static async getApplications(
    userId: string,
    role: "FARMER" | "LANDOWNER",
    filters?: {
      status?: ApplicationStatus[];
      search?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ) {
    const where: Prisma.ApplicationWhereInput = {};

    if (role === "FARMER") {
      where.farmerId = userId;
    } else {
      where.land = { landowner: { user: { id: userId } } };
    }

    if (filters?.status?.length) where.status = { in: filters.status };

    if (filters?.search) {
      where.OR = [
        { land: { title: { contains: filters.search, mode: "insensitive" } } },
        { farmer: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.ApplicationOrderByWithRelationInput = {};
    if (filters?.sortBy) {
      orderBy[
        filters.sortBy as keyof Prisma.ApplicationOrderByWithRelationInput
      ] = filters.sortOrder || "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
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
                      state: true,
                      district: true,
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
              email: true,
              imageUrl: true,
              farmerProfile: {
                select: {
                  primaryCrops: true,
                  farmingExperience: true,
                  isVerified: true,
                },
              },
            },
          },
          listing: true,
        },
        orderBy,
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications: applications.map((app) =>
        this.sanitizeApplicationResponse(
          app as unknown as Record<string, unknown>,
        ),
      ),

      total,
      hasMore: total > (filters?.offset || 0) + (filters?.limit || 20),
    };
  }

  /**
   * Get single application by ID
   */
  static async getApplicationById(
    applicationId: string,
    userId: string,
    userRole: string,
  ): Promise<SanitizedApplicationResponse> {
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
                  },
                },
              },
            },
            images: { where: { isPrimary: true }, take: 1 },
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
            farmerProfile: {
              select: {
                primaryCrops: true,
                farmingExperience: true,
                farmingType: true,
                isVerified: true,
              },
            },
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            status: true,
            listingType: true,
          },
        },
      },
    });

    if (!application) throw new AppError("Application not found", 404);

    const isFarmer = application.farmerId === userId;
    const isLandowner = application.land.landowner.user.id === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    if (!isFarmer && !isLandowner && !isAdmin)
      throw new AppError("Unauthorized", 403);

    return this.sanitizeApplicationResponse(
      application as unknown as Record<string, unknown>,
      {
        isFarmer,
        isLandowner,
        isAdmin,
      },
    );
  }

  /**
   * Sanitize application response (remove sensitive data + convert Decimals)
   */
  private static sanitizeApplicationResponse<T extends Record<string, unknown>>(
    app: T,
    permissions?: SanitizePermissions,
  ): SanitizedApplicationResponse {
    const sanitized = { ...app } as unknown as SanitizedApplicationResponse;

    // Convert Decimal fields to numbers
    sanitized.proposedRent = this.toNumberSafe(sanitized.proposedRent);

    if (sanitized.land) {
      const land = sanitized.land as unknown as Record<string, unknown>;

      land.expectedRentMin = this.toNumberSafe(land.expectedRentMin);
      land.expectedRentMax = this.toNumberSafe(land.expectedRentMax);
      land.depositAmount = this.toNumberSafe(land.depositAmount);
    }

    if (sanitized.listing) {
      const listing = sanitized.listing as unknown as Record<string, unknown>;
      listing.basePrice = this.toNumberSafe(listing.basePrice) ?? 0;
    }

    // Remove sensitive fields
    if (sanitized.farmer) {
      if (!permissions?.isLandowner && !permissions?.isAdmin) {
        delete sanitized.farmer.email;
        delete sanitized.farmer.phone;
      }
    }

    if (sanitized.land?.landowner) {
      if (!permissions?.isFarmer && !permissions?.isAdmin) {
        delete sanitized.land.landowner.email;
        delete sanitized.land.landowner.phone;
      }
    }

    return sanitized;
  }
}
