// app/api/admin/security/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";
import { logDetailedAction } from "@/lib/server/audit-logger";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { revokeAdminSession, revokeAllAdminSessions } from "@/lib/server/session-manager";

// Type definitions
interface SessionWhereClause {
  adminId?: string;
  isRevoked?: boolean;
  expiresAt?: {
    gt?: Date;
    lt?: Date;
  };
}

// ============================================
// GET /api/admin/security/sessions - List active sessions
// ============================================
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const adminId = searchParams.get("adminId");
    const status = searchParams.get("status"); // active, expired, revoked

    const where: SessionWhereClause = {};
    
    if (adminId) {
      where.adminId = adminId;
    }
    
    if (status === "active") {
      where.isRevoked = false;
      where.expiresAt = { gt: new Date() };
    } else if (status === "expired") {
      where.isRevoked = false;
      where.expiresAt = { lt: new Date() };
    } else if (status === "revoked") {
      where.isRevoked = true;
    }

    const [sessions, total, activeCount, expiredCount, revokedCount] = await Promise.all([
      prisma.adminSession.findMany({
        where: where as Record<string, unknown>,
        include: {
          admin: {
            select: { name: true, email: true, role: true },
          },
        },
        orderBy: { lastActive: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminSession.count({ where: where as Record<string, unknown> }),
      prisma.adminSession.count({
        where: { isRevoked: false, expiresAt: { gt: new Date() } },
      }),
      prisma.adminSession.count({
        where: { isRevoked: false, expiresAt: { lt: new Date() } },
      }),
      prisma.adminSession.count({
        where: { isRevoked: true },
      }),
    ]);

    // Get unique admins with active sessions
    const activeAdmins = await prisma.adminSession.groupBy({
      by: ["adminId"],
      where: { isRevoked: false, expiresAt: { gt: new Date() } },
      _count: true,
    });

    await logDetailedAction({
      adminId: admin.id,
      action: "VIEW_SESSIONS",
      entity: "SECURITY",
      metadata: {
        filters: { adminId, status },
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        admin: s.admin,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        location: s.location,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        lastActive: s.lastActive.toISOString(),
        isRevoked: s.isRevoked,
        isActive: !s.isRevoked && new Date(s.expiresAt) > new Date(),
      })),
      stats: {
        active: activeCount,
        expired: expiredCount,
        revoked: revokedCount,
        uniqueAdmins: activeAdmins.length,
      },
      activeAdmins: activeAdmins.map((a) => ({
        adminId: a.adminId,
        sessionCount: a._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/security/sessions - Revoke session(s)
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin({ allowedRoles: ["SUPER_ADMIN"] });
    const headersList = await headers();
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const targetAdminId = searchParams.get("adminId");
    const revokeAll = searchParams.get("all") === "true";

    if (revokeAll) {
      // Revoke all sessions
      const result = await prisma.adminSession.updateMany({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedBy: admin.id,
        },
      });

      await logDetailedAction({
        adminId: admin.id,
        action: "REVOKE_ALL_SESSIONS",
        entity: "SECURITY",
        metadata: {
          count: result.count,
          ipAddress: headersList.get("x-forwarded-for") || "unknown",
        },
      });

      return NextResponse.json({
        success: true,
        revoked: result.count,
        message: `Revoked ${result.count} active sessions`,
      });
    } else if (sessionId) {
      // Revoke specific session
      await revokeAdminSession(sessionId, admin.id);

      await logDetailedAction({
        adminId: admin.id,
        action: "REVOKE_SESSION",
        entity: "SECURITY",
        entityId: sessionId,
        metadata: {
          ipAddress: headersList.get("x-forwarded-for") || "unknown",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Session revoked successfully",
      });
    } else if (targetAdminId) {
      // Revoke all sessions for specific admin
      await revokeAllAdminSessions(targetAdminId, admin.id);

      await logDetailedAction({
        adminId: admin.id,
        action: "REVOKE_ADMIN_SESSIONS",
        entity: "SECURITY",
        metadata: {
          targetAdminId,
          ipAddress: headersList.get("x-forwarded-for") || "unknown",
        },
      });

      return NextResponse.json({
        success: true,
        message: "All sessions for admin revoked successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Missing required parameter" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke session(s)" },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/admin/security/sessions/me - Get current admin sessions
// ============================================
export async function GET_CURRENT(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const sessions = await prisma.adminSession.findMany({
      where: {
        adminId: admin.id,
        isRevoked: false,
      },
      orderBy: { lastActive: "desc" },
    });

    const currentSessionToken = req.headers.get("x-session-token");

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        location: s.location,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        lastActive: s.lastActive.toISOString(),
        isActive: new Date(s.expiresAt) > new Date(),
        isCurrent: currentSessionToken ? s.tokenHash === createHash('sha256').update(currentSessionToken).digest('hex') : false,
      })),
      activeCount: sessions.filter((s) => new Date(s.expiresAt) > new Date()).length,
    });
  } catch (error) {
    console.error("Current sessions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch current sessions" },
      { status: 500 }
    );
  }
}