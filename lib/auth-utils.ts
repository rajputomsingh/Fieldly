// lib/auth-utils.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Cache user lookups per request
const userCache = new Map<string, { id: string; ttl: number }>();

export async function getDbUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const cached = userCache.get(userId);
  if (cached && cached.ttl > Date.now()) {
    return cached.id;
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (user) {
    userCache.set(userId, { id: user.id, ttl: Date.now() + 60000 }); 
  }

  return user?.id ?? null;
}
