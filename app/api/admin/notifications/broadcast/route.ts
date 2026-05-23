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
  scheduledAt: z.string().datetime().optional(),
});

async function getAdminUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const admin = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true },
  });
  if (!admin?.role || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) return null;
  return admin;
}

async function getTargetUsers(
  targetType: string,
  targetRole?: string,
  targetIds?: string[]
): Promise<{ id: string }[]> {
  if (targetType === 'all') {
    return prisma.user.findMany({ where: { isOnboarded: true }, select: { id: true } });
  }
  if (targetType === 'role' && targetRole) {
    return prisma.user.findMany({
      where: { role: targetRole as 'FARMER' | 'LANDOWNER', isOnboarded: true },
      select: { id: true },
    });
  }
  if (targetType === 'specific' && targetIds?.length) {
    return prisma.user.findMany({ where: { id: { in: targetIds } }, select: { id: true } });
  }
  return [];
}

async function sendNotifications(
  targetUsers: { id: string }[],
  title: string,
  message: string,
  actionUrl?: string | null
) {
  if (targetUsers.length === 0) return;
  await prisma.notification.createMany({
    data: targetUsers.map(user => ({
      userId: user.id,
      type: 'SYSTEM' as NotificationType,
      title,
      message,
      actionUrl: actionUrl || null,
      isRead: false,
    })),
  });
  const created = await prisma.notification.findMany({
    where: {
      userId: { in: targetUsers.map(u => u.id) },
      title,
      createdAt: { gte: new Date(Date.now() - 60000) },
    },
    take: targetUsers.length,
  });
  for (const notification of created) {
    await pusherServer.trigger(`private-user-${notification.userId}`, 'new-notification', notification).catch(() => {});
  }
}

// GET - Fetch history
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const [sentActions, scheduled] = await Promise.all([
      type !== 'scheduled'
        ? prisma.adminAction.findMany({ where: { action: 'BROADCAST_NOTIFICATION', adminId: admin.id }, orderBy: { createdAt: 'desc' }, take: 50 })
        : Promise.resolve([]),
      type !== 'sent'
        ? prisma.scheduledNotification.findMany({ where: { adminId: admin.id }, orderBy: { scheduledAt: 'asc' } })
        : Promise.resolve([]),
    ]);
    return NextResponse.json({ sent: sentActions, scheduled });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send now or schedule
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const validated = broadcastSchema.parse(body);
    if (validated.scheduledAt) {
      const scheduled = await prisma.scheduledNotification.create({
        data: {
          title: validated.title, message: validated.message, priority: validated.priority,
          targetType: validated.targetType, targetRole: validated.targetRole,
          targetIds: validated.targetIds || [], actionUrl: validated.actionUrl,
          scheduledAt: new Date(validated.scheduledAt), adminId: admin.id,
        },
      });
      return NextResponse.json({ success: true, scheduled, message: 'Notification scheduled' });
    }
    const targetUsers = await getTargetUsers(validated.targetType, validated.targetRole, validated.targetIds);
    if (targetUsers.length === 0) return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    await sendNotifications(targetUsers, validated.title, validated.message, validated.actionUrl);
    await prisma.adminAction.create({
      data: {
        adminId: admin.id, action: 'BROADCAST_NOTIFICATION', entity: 'NOTIFICATION',
        metadata: { title: validated.title, targetType: validated.targetType, targetRole: validated.targetRole, targetCount: targetUsers.length, priority: validated.priority },
        ipAddress: req.headers.get('x-forwarded-for') || 'system', userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });
    return NextResponse.json({ success: true, sent: targetUsers.length, message: `Notification sent to ${targetUsers.length} users` });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Process scheduled
export async function PATCH() {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const now = new Date();
    const dueNotifications = await prisma.scheduledNotification.findMany({
      where: { status: 'PENDING', scheduledAt: { lte: now } },
    });
    let sent = 0, failed = 0;
    for (const scheduled of dueNotifications) {
      try {
        const targetUsers = await getTargetUsers(scheduled.targetType, scheduled.targetRole || undefined, scheduled.targetIds);
        await sendNotifications(targetUsers, scheduled.title, scheduled.message, scheduled.actionUrl);
        await prisma.scheduledNotification.update({ where: { id: scheduled.id }, data: { status: 'SENT', sentAt: new Date() } });
        await prisma.adminAction.create({
          data: {
            adminId: admin.id, action: 'BROADCAST_NOTIFICATION', entity: 'NOTIFICATION',
            metadata: { title: scheduled.title, targetType: scheduled.targetType, targetRole: scheduled.targetRole, targetCount: targetUsers.length, priority: scheduled.priority, scheduled: true },
            ipAddress: 'system', userAgent: 'auto-process',
          },
        });
        sent++;
      } catch {
        await prisma.scheduledNotification.update({ where: { id: scheduled.id }, data: { status: 'FAILED' } });
        failed++;
      }
    }
    return NextResponse.json({ success: true, sent, failed, total: dueNotifications.length });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Cancel scheduled
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.scheduledNotification.update({ where: { id }, data: { status: 'CANCELLED' } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}