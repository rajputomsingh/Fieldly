// app/api/admin/payments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";
import { logDetailedAction } from "@/lib/server/audit-logger";

// ============= VALIDATION SCHEMAS =============
const paymentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
      "PROCESSING",
      "PARTIALLY_REFUNDED",
      "CANCELLED",
    ])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

const processRefundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(10).max(500),
});

// ============= HELPER =============
const json = <T>(data: T, init?: ResponseInit): NextResponse<T> => {
  return NextResponse.json(data, init) as NextResponse<T>;
};

// ============= GET /api/admin/payments =============
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();

    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const validated = paymentQuerySchema.parse(queryParams);
    const { page, limit, status, startDate, endDate, search } = validated;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        { razorpayOrderId: { contains: search, mode: "insensitive" } },
        { razorpayPaymentId: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch payments with pagination
    const [payments, total, stats] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lease: {
            select: {
              id: true,
              land: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ["status"],
        _sum: {
          amount: true,
          netAmount: true,
        },
        _count: true,
      }),
    ]);

    // Calculate statistics
    const statusStats: Record<string, { count: number; amount: number }> = {};
    stats.forEach((s) => {
      statusStats[s.status] = {
        count: s._count,

        amount: s._sum.amount?.toNumber() ?? 0,
      };
    });

    const totalRevenue = stats
      .filter((s) => s.status === "SUCCESS")
      .reduce(
        (sum, s) =>
          sum +
          (s._sum.netAmount?.toNumber() ?? s._sum.amount?.toNumber() ?? 0),
        0,
      );

    const pendingAmount = stats
      .filter((s) => s.status === "PENDING" || s.status === "PROCESSING")
      .reduce((sum, s) => sum + (s._sum.amount?.toNumber() ?? 0), 0);

    // Log the view action
    await logDetailedAction({
      adminId: admin.id,
      action: "VIEW_PAYMENTS",
      entity: "PAYMENT",
      metadata: {
        filters: { status, startDate, endDate, search },
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return json({
      payments,
      stats: {
        total,
        totalRevenue,
        pendingAmount,
        byStatus: statusStats,
      },
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
    console.error("Payments fetch error:", error);

    if (error instanceof z.ZodError) {
      return json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 },
      );
    }

    return json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// ============= POST /api/admin/payments/refund =============
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();
    const body = await req.json();

    const validated = processRefundSchema.parse(body);
    const { paymentId, amount, reason } = validated;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "SUCCESS") {
      return json(
        { error: "Only successful payments can be refunded" },
        { status: 400 },
      );
    }

    if (amount > (payment.amount?.toNumber() ?? 0)) {
      return json(
        { error: "Refund amount cannot exceed payment amount" },
        { status: 400 },
      );
    }

    const isFullRefund = amount >= (payment.amount?.toNumber() ?? 0);
    const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        notes: `Refund processed: ${reason}`,
      },
    });

    await logDetailedAction({
      adminId: admin.id,
      action: "PROCESS_REFUND",
      entity: "PAYMENT",
      entityId: paymentId,
      changes: {
        before: {
          status: payment.status,
          amount: payment.amount?.toNumber() ?? 0,
        },
        after: { status: newStatus, refundedAmount: amount },
      },
      metadata: {
        refundAmount: amount,
        isFullRefund,
        reason,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return json({
      success: true,
      payment: updatedPayment,
      message: `Refund of ₹${amount} processed successfully`,
    });
  } catch (error) {
    console.error("Refund processing error:", error);

    if (error instanceof z.ZodError) {
      return json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return json({ error: "Failed to process refund" }, { status: 500 });
  }
}

// ============= OPTIONS =============
export async function OPTIONS(): Promise<NextResponse> {
  return json(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
