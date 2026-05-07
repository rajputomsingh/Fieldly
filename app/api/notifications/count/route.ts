// app/api/notifications/count/route.ts
import { NextResponse } from "next/server";
import { getDbUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbUserId = await getDbUserId();

    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.notification.count({
      where: {
        userId: dbUserId,
        isRead: false,
      },
    });

    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Notification count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
