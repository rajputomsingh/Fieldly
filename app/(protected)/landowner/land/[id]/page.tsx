// app/(protected)/landowner/land/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  LandHeader,
  LandStats,
  LandFeatures,
  LandDescription,
  ListingsSection,
  LeasesSection,
  DocumentsSection,
  SoilReportSection,
} from "./_components";

/* =========================
   DATA FETCHING
========================= */

async function getLand(landId: string, userId: string) {
  if (!landId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      landownerProfile: { select: { id: true } },
    },
  });

  if (!user?.landownerProfile) return null;

  const land = await prisma.land.findUnique({
    where: { id: landId },
    include: {
      listings: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: {
            select: {
              bids: true,
              savedBy: true,
            },
          },
        },
      },
      leases: {
        orderBy: { startDate: "desc" },
        take: 5,
        include: {
          farmer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      documents: true,
      soilReports: {
        orderBy: { testedAt: "desc" },
        take: 1,
      },
      images: true,
    },
  });

  if (!land) return null;

  // Security check
  if (land.landownerId !== user.landownerProfile.id) {
    throw new Error("Unauthorized");
  }

  // Debug: Log the description to check if it's being fetched
  console.log("Land description from DB:", land.description);

  // Return the land data with proper transformations
  return {
    ...land,
    description: land.description, // Keep as is - it's already string | null
    listings: land.listings.map((listing) => ({
      ...listing,
      basePrice: listing.basePrice?.toNumber() ?? 0,
      reservePrice: listing.reservePrice?.toNumber() ?? null,
      buyNowPrice: listing.buyNowPrice?.toNumber() ?? null,
      highestBid: listing.highestBid?.toNumber() ?? null,
      bidIncrement: listing.bidIncrement?.toNumber() ?? 0,
      startDate: listing.startDate?.toISOString() || null,
      endDate: listing.endDate?.toISOString() || null,
      _count: {
        bids: listing._count?.bids || 0,
        savedBy: listing._count?.savedBy || 0,
      },
    })),
    
    leases: land.leases.map((lease) => ({
      ...lease,
      rent: lease.rent?.toNumber() ?? 0,
      securityDeposit: lease.securityDeposit?.toNumber() ?? null,
      grossContractValue: lease.grossContractValue?.toNumber() ?? null,
      netOwnerReceivable: lease.netOwnerReceivable?.toNumber() ?? null,
      platformFee: lease.platformFee?.toNumber() ?? null,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate.toISOString(),
      farmer: lease.farmer
        ? {
            name: lease.farmer.name,
            email: lease.farmer.email,
          }
        : null,
    })),

    documents: land.documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt?.toISOString() || null,
    })),
    soilReports: land.soilReports.map((report) => ({
      ...report,
      testedAt: report.testedAt?.toISOString() || null,
      createdAt: report.createdAt.toISOString(),
    })),
  };
}

/* =========================
   PAGE COMPONENT
========================= */

export default async function LandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const land = await getLand(id, userId);
  if (!land) notFound();

  // Debug: Log the final description being passed
  console.log("Final description to component:", land.description);

  const location = {
    village: land.village,
    district: land.district,
    state: land.state,
    pincode: land.pincode,
    address: land.address,
    latitude: land.latitude,
    longitude: land.longitude,
  };

  const locationString = [land.village, land.district, land.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen mt-22">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Breadcrumb Navigation */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link
              href="/landowner/dashboard"
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <Home className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/landowner/lands"
              className="hover:text-primary transition-colors"
            >
              My Lands
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {land.title}
            </span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Header Section */}
          <LandHeader
            title={land.title}
            location={locationString}
            locationData={location}
            landId={land.id}
          />

          {/* Quick Stats Grid */}
          <LandStats
            size={land.size}
            soilType={land.soilType}
            waterSource={land.waterSource}
            expectedRentMin={land.expectedRentMin?.toNumber() ?? null}
            expectedRentMax={land.expectedRentMax?.toNumber() ?? null}
          />

          {/* Features Section */}
          <LandFeatures
            irrigationAvailable={land.irrigationAvailable}
            electricityAvailable={land.electricityAvailable}
            roadAccess={land.roadAccess}
            fencingAvailable={land.fencingAvailable}
          />

          <LandDescription
            description={
              land.description || land.listings?.[0]?.description || null
            }
            landId={land.id}
            isEditable={true}
          />

          {/* Dynamic Sections Grid */}
          <div className="space-y-8">
            {/* Listings Section */}
            <ListingsSection listings={land.listings} landId={land.id} />

            {/* Leases Section */}
            <LeasesSection leases={land.leases} />

            {/* Documents Section */}
            <DocumentsSection documents={land.documents} />

            {/* Soil Report Section */}
            <SoilReportSection soilReports={land.soilReports} />
          </div>
        </div>
      </div>
    </div>
  );
}
