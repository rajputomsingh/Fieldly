// app/(protected)/landowner/dashboard/_server/ApplicationsSection.tsx

import { prisma } from "@/lib/prisma";
import {
  RecentApplications,
  type RecentApplication,
} from "../_components/RecentApplications";

export async function ApplicationsSection({ userId }: { userId: string }) {
  // Get the database user ID from Clerk userId
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!user) return null;

  const apps = await prisma.application.findMany({
    where: {
      land: {
        landowner: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      status: true,
      proposedRent: true,
      createdAt: true,
      land: {
        select: {
          title: true,
        },
      },
      farmer: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  console.log(`📊 Found ${apps.length} applications for user ${user.id}`);

  const mapped: RecentApplication[] = apps.map((a) => ({
    id: a.id,
    farmerName: a.farmer.name,
    farmerImage: a.farmer.imageUrl,
    proposedRent: a.proposedRent
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(a.proposedRent.toNumber())
      : null,
    status: a.status as RecentApplication["status"],
    createdAt: a.createdAt.toISOString(),
    landTitle: a.land.title,
  }));

  return <RecentApplications applications={mapped} />;
}
