// lib/server/session-manager.ts
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export async function createAdminSession(
  adminId: string,
  ipAddress: string,
  userAgent?: string
) {
  // Generate raw token
  const rawToken = randomBytes(32).toString("hex");
  
  // Hash token for database storage
  const tokenHash = createHash("sha256")
    .update(rawToken)
    .digest("hex");
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12); // 12 hour session

  const session = await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash,    // Store hash, not raw token
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  // Return raw token only to the caller (client)
  return {
    id: session.id,
    token: rawToken,
    expiresAt: session.expiresAt,
  };
}

export async function validateAdminSession(rawToken: string): Promise<{ valid: boolean; adminId?: string }> {
  // Hash the incoming token to compare with stored hash
  const tokenHash = createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (session) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });
    return { valid: true, adminId: session.adminId };
  }

  return { valid: false };
}

export async function revokeAdminSession(sessionId: string, revokedBy: string) {
  return prisma.adminSession.update({
    where: { id: sessionId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
    },
  });
}

export async function revokeAllAdminSessions(adminId: string, revokedBy: string) {
  return prisma.adminSession.updateMany({
    where: {
      adminId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
    },
  });
}