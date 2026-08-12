import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { land: { title: { contains: search, mode: "insensitive" } } },
        { farmer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [applications, total, stats] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          land: {
            select: {
              title: true,
              size: true,
              landType: true,
              village: true,
              district: true,
            },
          },
          farmer: {
            select: { name: true, email: true, imageUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where }),
      prisma.application.groupBy({
        by: ["status"],
        where,
        _count: true,
        _sum: { proposedRent: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    stats.forEach((s) => {
      byStatus[s.status] = s._count;
    });

    const totalValue = stats.reduce(
      (sum, s) => sum + (s._sum.proposedRent?.toNumber() ?? 0),
      0,
    );

    const transformedApplications = applications.map((app) => ({
      ...app,
      proposedRent: app.proposedRent?.toNumber() ?? null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      applications: transformedApplications,
      stats: {
        total,
        totalValue,
        byStatus,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_APPLICATIONS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}