// app/(marketplace)/listings/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ListingDetail } from "../../_components/ListingDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const listing = await prisma.landListing.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      land: {
        select: {
          district: true,
          state: true,
          images: {
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });

  if (!listing) {
    return {
      title: "Listing Not Found",
      description: "The requested land listing could not be found.",
    };
  }

  return {
    title: `${listing.title} - Fieldly Marketplace`,
    description: listing.description || `Agricultural land in ${listing.land.district}, ${listing.land.state}`,
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;

  const listing = await prisma.landListing.findUnique({
    where: { id },
    include: {
      land: {
        include: {
          soilReports: { orderBy: { testedAt: "desc" }, take: 1 },
          documents: { select: { id: true, name: true, url: true, type: true, size: true, createdAt: true } },
          images: { take: 10, select: { id: true, url: true, caption: true, isPrimary: true } },
        },
      },
      owner: { include: { landownerProfile: true } },
      terms: true,
      images: { orderBy: { sortOrder: "asc" } },
      analytics: true,
      bids: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          farmerId: true,
          createdAt: true,
          isAutoBid: true,
          farmer: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      _count: { select: { bids: true, savedBy: true, applications: true } },
    },
  });

  if (!listing) notFound();

  // Serialize dates and convert Decimals to numbers
  const serializedListing = {
    ...listing,
    basePrice: listing.basePrice?.toNumber() ?? 0,
    reservePrice: listing.reservePrice?.toNumber() ?? null,
    buyNowPrice: listing.buyNowPrice?.toNumber() ?? null,
    highestBid: listing.highestBid?.toNumber() ?? null,
    bidIncrement: listing.bidIncrement?.toNumber() ?? 0,
    endDate: listing.endDate.toISOString(),
    startDate: listing.startDate.toISOString(),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    publishedAt: listing.publishedAt?.toISOString() || null,
    lastBidAt: listing.lastBidAt?.toISOString() || null,
    land: {
      ...listing.land,
      depositAmount: listing.land.depositAmount?.toNumber() ?? null,
      expectedRentMin: listing.land.expectedRentMin?.toNumber() ?? null,
      expectedRentMax: listing.land.expectedRentMax?.toNumber() ?? null,
      createdAt: listing.land.createdAt.toISOString(),
      updatedAt: listing.land.updatedAt.toISOString(),
      soilReports: listing.land.soilReports?.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), testedAt: r.testedAt?.toISOString() || null })) || [],
      documents: listing.land.documents?.map(d => ({ ...d, createdAt: d.createdAt?.toISOString() || null })) || [],
      images: listing.land.images || [],
    },
    owner: { ...listing.owner, createdAt: listing.owner.createdAt.toISOString(), updatedAt: listing.owner.updatedAt.toISOString() },
    bids: listing.bids?.map(b => ({ ...b, amount: b.amount?.toNumber() ?? 0, createdAt: b.createdAt.toISOString() })) || [],
    images: listing.images || [],
    terms: listing.terms ? { ...listing.terms, depositAmount: listing.terms.depositAmount?.toNumber() ?? null, createdAt: listing.terms.createdAt.toISOString(), updatedAt: listing.terms.updatedAt.toISOString() } : null,
    analytics: listing.analytics ? { ...listing.analytics, lastActivityAt: listing.analytics.lastActivityAt?.toISOString() || null } : null,
    _count: { bids: listing._count?.bids || 0, savedBy: listing._count?.savedBy || 0, applications: listing._count?.applications || 0 },
  };

  return <ListingDetail listing={serializedListing} />;
}