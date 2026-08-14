// app/api/landowner/lands/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/storage/supabase-server";
import { v4 as uuid } from "uuid";
import {
  LandType,
  ListingType,
  PaymentFrequency,
  ListingStatus,
} from "@prisma/client";

// Import notification trigger
import { notifyMatchingFarmersAboutListing } from "@/services/notifications/notificationTrigger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const ownerId = searchParams.get("ownerId");
    const isActive = searchParams.get("isActive") === "true";
    const isArchived = searchParams.get("isArchived") === "false";

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId required" }, { status: 400 });
    }

    // Find the LandownerProfile first
    const landownerProfile = await prisma.landownerProfile.findUnique({
      where: { userId: ownerId },
    });

    if (!landownerProfile) {
      return NextResponse.json({ lands: [] });
    }

    const lands = await prisma.land.findMany({
      where: {
        landownerId: landownerProfile.id,
        ...(isActive ? { isActive: true } : {}),
        ...(isArchived ? { isArchived: false } : {}),
      },
      select: {
        id: true,
        title: true,
        size: true,
        landType: true,
        village: true,
        district: true,
        state: true,
        minLeaseDuration: true,
        maxLeaseDuration: true,
        expectedRentMin: true,
        expectedRentMax: true,
        isActive: true,
        isArchived: true,
      },
    });

    return NextResponse.json({ lands });
  } catch (error) {
    console.error("[LANDS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // ---------------- INPUT ----------------
    const formData = await req.formData();

    // ---------------- USER ----------------
    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkId },
      include: { landownerProfile: true },
    });

    if (!user || !user.landownerProfile) {
      return NextResponse.json(
        { success: false, error: "Complete landowner profile first" },
        { status: 400 },
      );
    }

    const landownerProfile = user.landownerProfile;

    // ---------------- HELPERS ----------------
    type FDValue = FormDataEntryValue | null;

    const num = (v: FDValue): number | null => {
      if (!v || typeof v !== "string") return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const bool = (v: FDValue): boolean => v === "true";

    const parseJSON = <T>(v: FDValue, fallback: T): T => {
      try {
        return v && typeof v === "string" ? (JSON.parse(v) as T) : fallback;
      } catch {
        return fallback;
      }
    };

    // ---------------- PARSED ----------------
    const allowedCropTypes = parseJSON<string[]>(
      formData.get("allowedCropTypes"),
      [],
    );

    const previousCrops = parseJSON<string[]>(
      formData.get("previousCrops"),
      [],
    );

    // ---------------- VALIDATION ----------------
    if (!formData.get("title") || !formData.get("size")) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ---------------- TRANSACTION ----------------
    const result = await prisma.$transaction(async (tx) => {
      const land = await tx.land.create({
        data: {
          landownerId: landownerProfile.id,
          title: formData.get("title") as string,
          size: Number(formData.get("size")),
          landType: formData.get("landType") as LandType,
          village: formData.get("village") as string,
          district: (formData.get("district") as string) || null,
          state: (formData.get("state") as string) || null,
          soilType: (formData.get("soilType") as string) || null,
          latitude: num(formData.get("latitude")),
          longitude: num(formData.get("longitude")),
          irrigationAvailable: bool(formData.get("irrigationAvailable")),
          electricityAvailable: bool(formData.get("electricityAvailable")),
          roadAccess: bool(formData.get("roadAccess")),
          fencingAvailable: bool(formData.get("fencingAvailable")),
          storageAvailable: bool(formData.get("storageAvailable")),
          allowedCropTypes,
          previousCrops,
          allowsInfrastructureModification: bool(
            formData.get("allowsInfrastructureModification"),
          ),
          allowsOrganicFarming:
            formData.get("allowsOrganicFarming") !== "false",
          allowsSubleasing: bool(formData.get("allowsSubleasing")),
          minLeaseDuration: Number(formData.get("minLeaseDuration") || 12),
          maxLeaseDuration: Number(formData.get("maxLeaseDuration") || 60),
          expectedRentMin: num(formData.get("expectedRentMin")),
          expectedRentMax: num(formData.get("expectedRentMax")),
          depositAmount: num(formData.get("depositAmount")),
        },
      });

      const listing = await tx.landListing.create({
        data: {
          landId: land.id,
          ownerId: user.id,
          title: land.title,
          description: (formData.get("description") as string) || null,
          listingType:
            (formData.get("listingType") as ListingType) || "OPEN_BIDDING",
          basePrice: Number(formData.get("basePrice")),
          reservePrice: num(formData.get("reservePrice")),
          buyNowPrice: num(formData.get("buyNowPrice")),
          startDate: new Date(formData.get("listingStartDate") as string),
          endDate: new Date(formData.get("listingEndDate") as string),
          minimumLeaseDuration: land.minLeaseDuration,
          maximumLeaseDuration: land.maxLeaseDuration,
          status: "ACTIVE" as ListingStatus,
        },
      });

      await tx.listingTerms.create({
        data: {
          listingId: listing.id,
          paymentFrequency:
            (formData.get("paymentFrequency") as PaymentFrequency) || "MONTHLY",
          securityDepositRequired:
            formData.get("securityDepositRequired") === "true",
          depositAmount: num(formData.get("depositAmount")),
          additionalTerms: (formData.get("additionalTerms") as string) || null,
        },
      });

      return { land, listing };
    });

    // ---------------- IMAGE UPLOAD ----------------
    const files = formData.getAll("images") as File[];

    if (files.length) {
      await Promise.all(
        files.map(async (file, i) => {
          const ext = file.name.split(".").pop();
          const key = `${result.listing.id}/${uuid()}.${ext}`;

          const { error } = await supabaseAdmin.storage
            .from("lands")
            .upload(key, file);

          if (error) throw error;

          const { data } = supabaseAdmin.storage
            .from("lands")
            .getPublicUrl(key);

          await prisma.listingImage.create({
            data: {
              listingId: result.listing.id,
              url: data.publicUrl,
              isPrimary: i === 0,
              sortOrder: i,
            },
          });
        }),
      );
    }

    // ---------------- AUDIT ----------------
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LAND_CREATED",
        metadata: {
          landId: result.land.id,
          listingId: result.listing.id,
        },
      },
    });

    // NOTIFY MATCHING FARMERS
    notifyMatchingFarmersAboutListing(result.land.id, result.listing.id)
      .then((notificationResult) => {
        console.log(
          `Notified ${notificationResult.notified} farmers about new listing`,
        );
      })
      .catch((error) => {
        console.error("Failed to notify farmers:", error);
      });

    // ---------------- SUCCESS ----------------
    return NextResponse.json(
      {
        success: true,
        landId: result.land.id,
        listingId: result.listing.id,
        data: result.land,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("LAND CREATE ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create listing",
      },
      { status: 500 },
    );
  }
}
