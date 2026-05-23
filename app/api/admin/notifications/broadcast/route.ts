// app/api/admin/notifications/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher/server';
import { z } from 'zod';
import type { NotificationType } from '@prisma/client';

const broadcastSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  targetType: z.enum(['all', 'role', 'specific']),
  targetRole: z.enum(['FARMER', 'LANDOWNER']).optional(),
  targetIds: z.array(z.string()).optional(),
  actionUrl: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true },
    });

    if (!admin?.role || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = broadcastSchema.parse(body);

    // Determine target users
    let targetUsers: { id: string }[] = [];

    if (validated.targetType === 'all') {
      targetUsers = await prisma.user.findMany({
        where: { isOnboarded: true },
        select: { id: true },
      });
    } else if (validated.targetType === 'role' && validated.targetRole) {
      targetUsers = await prisma.user.findMany({
        where: {
          role: validated.targetRole,
          isOnboarded: true,
        },
        select: { id: true },
      });
    } else if (validated.targetType === 'specific' && validated.targetIds?.length) {
      targetUsers = await prisma.user.findMany({
        where: { id: { in: validated.targetIds } },
        select: { id: true },
      });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    }

    // Create notifications in bulk
    const notificationData = targetUsers.map(user => ({
      userId: user.id,
      type: 'SYSTEM' as NotificationType,
      title: validated.title,
      message: validated.message,
      actionUrl: validated.actionUrl || null,
      isRead: false,
    }));

    await prisma.notification.createMany({ data: notificationData });

    // Fetch created notifications for Pusher events
    const createdNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: targetUsers.map(u => u.id) },
        title: validated.title,
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
      take: targetUsers.length,
    });

    // Trigger Pusher events in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < createdNotifications.length; i += BATCH_SIZE) {
      const batch = createdNotifications.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(notification =>
          pusherServer.trigger(
            `private-user-${notification.userId}`,
            'new-notification',
            notification
          )
        )
      );
    }

    // Audit log
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: 'BROADCAST_NOTIFICATION',
        entity: 'NOTIFICATION',
        metadata: {
          title: validated.title,
          targetType: validated.targetType,
          targetRole: validated.targetRole,
          targetCount: targetUsers.length,
          priority: validated.priority,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      sent: targetUsers.length,
      message: `Notification broadcasted to ${targetUsers.length} users`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}