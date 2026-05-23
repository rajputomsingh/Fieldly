// app/(protected)/admin/notifications/page.tsx
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { AdminNotificationsClient } from './_components/AdminNotificationsClient';

interface BroadcastRecord {
  id: string;
  action: string;
  entity: string;
  metadata: {
    title?: string;
    targetType?: string;
    targetRole?: string;
    targetCount?: number;
    priority?: string;
    scheduledAt?: string;
    status?: string;
  };
  createdAt: string;
}

export default async function AdminNotificationsPage() {
  const { userId } = await auth();
  
  const admin = await prisma.user.findUnique({
    where: { clerkUserId: userId! },
    select: { id: true, role: true },
  });

  // Fetch user counts
  const [farmerCount, landownerCount, totalCount] = await Promise.all([
    prisma.user.count({ where: { role: 'FARMER', isOnboarded: true } }),
    prisma.user.count({ where: { role: 'LANDOWNER', isOnboarded: true } }),
    prisma.user.count({ where: { isOnboarded: true } }),
  ]);

  // Fetch sent broadcasts from AdminAction
  const sentActions = await prisma.adminAction.findMany({
    where: {
      action: 'BROADCAST_NOTIFICATION',
      adminId: admin!.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Fetch scheduled notifications
  const scheduled = await prisma.scheduledNotification.findMany({
    where: {
      adminId: admin!.id,
      status: 'PENDING',
    },
    orderBy: { scheduledAt: 'asc' },
    take: 20,
  });

  // Combine both into BroadcastRecord array
  const recentBroadcasts: BroadcastRecord[] = [
    // Sent broadcasts
    ...sentActions.map(a => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      metadata: (a.metadata || {}) as BroadcastRecord['metadata'],
      createdAt: a.createdAt.toISOString(),
    })),
    // Scheduled notifications
    ...scheduled.map(s => ({
      id: s.id,
      action: 'SCHEDULED_NOTIFICATION',
      entity: 'NOTIFICATION',
      metadata: {
        title: s.title,
        targetType: s.targetType,
        targetRole: s.targetRole || undefined,
        targetCount: 0,
        priority: s.priority,
        scheduledAt: s.scheduledAt.toISOString(),
        status: s.status,
      },
      createdAt: s.createdAt.toISOString(),
    })),
  ];

  // Sort by createdAt descending
  recentBroadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AdminNotificationsClient
      adminRole={admin?.role ?? 'ADMIN'}
      userCounts={{ farmerCount, landownerCount, totalCount }}
      recentBroadcasts={recentBroadcasts}
    />
  );
}