// app/(protected)/admin/notifications/page.tsx
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { AdminNotificationsClient } from './_components/AdminNotificationsClient';

export default async function AdminNotificationsPage() {
  const { userId } = await auth();
  
  const admin = await prisma.user.findUnique({
    where: { clerkUserId: userId! },
    select: { id: true, role: true },
  });

  // Fetch user counts for the form
  const [farmerCount, landownerCount, totalCount] = await Promise.all([
    prisma.user.count({ where: { role: 'FARMER', isOnboarded: true } }),
    prisma.user.count({ where: { role: 'LANDOWNER', isOnboarded: true } }),
    prisma.user.count({ where: { isOnboarded: true } }),
  ]);

  // Fetch recent broadcasts
  const recentBroadcasts = await prisma.adminAction.findMany({
    where: {
      action: 'BROADCAST_NOTIFICATION',
      adminId: admin!.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <AdminNotificationsClient
      adminRole={admin?.role ?? 'ADMIN'}
      userCounts={{ farmerCount, landownerCount, totalCount }}
      recentBroadcasts={recentBroadcasts as unknown as Array<{
        id: string;
        action: string;
        entity: string;
        metadata: {
          title?: string;
          targetType?: string;
          targetRole?: string;
          targetCount?: number;
          priority?: string;
        };
        createdAt: string;
      }>}
    />
  );
}