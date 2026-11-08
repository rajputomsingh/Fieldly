"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { LandownerOnboardingInput } from "@/lib/validations/onboarding";

/* ============================================================
   TYPES
============================================================ */

export interface FarmerFormData {
  phone: string;
  district: string;
  state: string;
  bio?: string | null;
  primaryCrops: string[];
  farmingExperience: number;
  farmingType: "SUBSISTENCE" | "COMMERCIAL" | "ORGANIC" | "MIXED";
  requiredLandSize: number;
  leaseDuration: number;
  irrigationNeeded: boolean;
  equipmentAccess: boolean;
}

export interface OnboardingResult {
  success: boolean;
  error?: string;
}

/* ============================================================
   HELPERS
============================================================ */

function sanitizeString(value?: string | null) {
  if (!value) return null;
  return value.trim().slice(0, 500);
}

function toBoolean(value?: boolean | string | null) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

function toNumber(value?: number | string | null) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

/* ============================================================
   GET OR CREATE USER (OPTIMIZED)
   NOTE: not exported — see GHSA-369m-w6hw-7r89. Exporting
   an async function from a "use server" module exposes it as
   a callable server action that returns the full user record.
============================================================ */

async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (existing) return existing;

  const clerkUser = await currentUser();

  return prisma.user.create({
    data: {
      clerkUserId: userId,
      email:
        clerkUser?.emailAddresses?.[0]?.emailAddress ??
        `${userId}@temp.com`,
      name:
        `${clerkUser?.firstName ?? ""} ${
          clerkUser?.lastName ?? ""
        }`.trim() || "User",
      role: null,
      isOnboarded: false,
      onboardingStep: 0,
    },
  });
}

/* ============================================================
   SET ROLE
   SECURITY (GHSA-369m-w6hw-7r89):
   - Runtime allow-list — TypeScript types do not exist at
     runtime, so client-supplied role must be re-checked.
   - Atomic conditional update — closes a race condition where
     two concurrent requests could both pass the "role already
     set" check and one silently overwrite the other.
   - Generic error message on failure — no Prisma error text
     leaks to the client.
============================================================ */

export async function setUserRole(role: unknown): Promise<OnboardingResult> {
  try {
    if (role !== "FARMER" && role !== "LANDOWNER") {
      return { success: false, error: "Invalid role" };
    }

    const user = await getOrCreateUser();

    const result = await prisma.user.updateMany({
      where: { id: user.id, role: null },
      data: {
        role,
        onboardingStep: 1,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Role already selected" };
    }

    return { success: true };
  } catch (error) {
    console.error("Set user role failed:", error);
    return {
      success: false,
      error: "Failed to set role",
    };
  }
}

/* ============================================================
   FARMER ONBOARDING
============================================================ */

export async function completeFarmerOnboarding(
  formData: FarmerFormData
): Promise<OnboardingResult> {
  try {
    const user = await getOrCreateUser();

    if (user.isOnboarded) {
      return { success: false, error: "Already onboarded" };
    }

    if (user.role !== "FARMER") {
      return { success: false, error: "Invalid role" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          phone: formData.phone,
          district: formData.district,
          state: formData.state,
          bio: sanitizeString(formData.bio),
          onboardingStep: 3,
          isOnboarded: false,
        },
      });

      await tx.farmerProfile.upsert({
        where: { userId: user.id },
        update: {
          primaryCrops: formData.primaryCrops,
          farmingExperience: toNumber(formData.farmingExperience),
          farmingType: formData.farmingType,
          requiredLandSize: toNumber(formData.requiredLandSize),
          leaseDuration: toNumber(formData.leaseDuration),
          irrigationNeeded: toBoolean(formData.irrigationNeeded),
          equipmentAccess: toBoolean(formData.equipmentAccess),
        },
        create: {
          userId: user.id,
          primaryCrops: formData.primaryCrops,
          farmingExperience: toNumber(formData.farmingExperience),
          farmingType: formData.farmingType,
          requiredLandSize: toNumber(formData.requiredLandSize),
          leaseDuration: toNumber(formData.leaseDuration),
          irrigationNeeded: toBoolean(formData.irrigationNeeded),
          equipmentAccess: toBoolean(formData.equipmentAccess),
        },
      });
    });

    // ACTIVITY (FIX)
    await Promise.allSettled([
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Welcome to Fieldly! 🎉",
          message: "Your farmer profile is complete.",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "FARMER_ONBOARDING_COMPLETED",
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Onboarding failed",
    };
  }
}

/* ============================================================
   LANDOWNER ONBOARDING
============================================================ */

export async function completeLandownerOnboarding(
  formData: LandownerOnboardingInput
): Promise<OnboardingResult> {
  try {
    const user = await getOrCreateUser();

    if (user.isOnboarded) {
      return { success: false, error: "Already onboarded" };
    }

    if (user.role !== "LANDOWNER") {
      return { success: false, error: "Invalid role" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          phone: formData.phone,
          district: formData.district,
          state: formData.state,
          bio: sanitizeString(formData.bio),
          onboardingStep: 3,
          isOnboarded: false,
        },
      });

      await tx.landownerProfile.upsert({
        where: { userId: user.id },
        update: {
          ownershipType: formData.ownershipType,
          preferredPaymentFrequency:
            formData.preferredPaymentFrequency,
          preferredContactMethod:
            formData.preferredContactMethod,
          verificationLevel: 1,
        },
        create: {
          userId: user.id,
          ownershipType: formData.ownershipType,
          preferredPaymentFrequency:
            formData.preferredPaymentFrequency,
          preferredContactMethod:
            formData.preferredContactMethod,
          verificationLevel: 1,
        },
      });
    });

    // ACTIVITY (FIX)
    await Promise.allSettled([
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Welcome to Fieldly! 🎉",
          message: "Your landowner profile is complete.",
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LANDOWNER_ONBOARDING_COMPLETED",
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Onboarding failed",
    };
  }
}

/* ============================================================
   FINALIZE ONBOARDING
============================================================ */

export async function finalizeOnboarding(): Promise<OnboardingResult> {
  try {
    const user = await getOrCreateUser();

    if (user.onboardingStep !== 3) {
      return { success: false, error: "Invalid onboarding state" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStep: 4,
        isOnboarded: true,
      },
    });

    // FINAL ACTIVITY
    await Promise.allSettled([
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Onboarding Completed 🎉",
          message: `Your ${user.role?.toLowerCase()} profile is now live.`,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "ONBOARDING_FINALIZED",
        },
      }),
    ]);

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finalize",
    };
  }
}