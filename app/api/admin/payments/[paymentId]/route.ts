// app/api/admin/payments/[paymentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";
import { logDetailedAction } from "@/lib/server/audit-logger";

// ============= TYPES =============
interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

// ============= VALIDATION SCHEMAS =============
const updatePaymentSchema = z.object({
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
  notes: z.string().max(500).optional(),
});

// ============= HELPER =============
const json = <T>(data: T, init?: ResponseInit): NextResponse<T> => {
  return NextResponse.json(data, init) as NextResponse<T>;
};

// ============= GET /api/admin/payments/[paymentId] =============
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();

    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        lease: {
          select: {
            id: true,
            rent: true,
            startDate: true,
            endDate: true,
            status: true,
            land: {
              select: {
                id: true,
                title: true,
                size: true,
                landType: true,
                village: true,
                district: true,
                state: true,
              },
            },
            farmer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return json({ error: "Payment not found" }, { status: 404 });
    }

    // Get related audit logs for this payment
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: "PAYMENT",
        entityId: paymentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    await logDetailedAction({
      adminId: admin.id,
      action: "VIEW_PAYMENT_DETAILS",
      entity: "PAYMENT",
      entityId: paymentId,
      metadata: {
        paymentAmount: payment.amount?.toNumber() ?? 0,
        paymentStatus: payment.status,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return json({
      payment,
      auditLogs,
    });
  } catch (error) {
    console.error("Payment fetch error:", error);
    return json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}

// ============= PATCH /api/admin/payments/[paymentId] =============
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();
    const body = await req.json();

    const { paymentId } = await params;
    const validated = updatePaymentSchema.parse(body);

    const currentPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        amount: true,
        notes: true,
        userId: true,
        leaseId: true,
      },
    });

    if (!currentPayment) {
      return json({ error: "Payment not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (validated.status) updateData.status = validated.status;
    if (validated.notes) updateData.notes = validated.notes;

    // If marking as paid, set paidAt
    if (validated.status === "SUCCESS") {
      updateData.paidAt = new Date();
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
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
    });

    // Create audit log for the change
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_PAYMENT",
        entity: "PAYMENT",
        entityId: paymentId,
        metadata: {
          before: { status: currentPayment.status },
          after: { status: updatedPayment.status },
          updatedBy: admin.name,
        },
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
        userAgent: headersList.get("user-agent") || undefined,
      },
    });

    await logDetailedAction({
      adminId: admin.id,
      action: "UPDATE_PAYMENT",
      entity: "PAYMENT",
      entityId: paymentId,
      changes: {
        before: { status: currentPayment.status },
        after: { status: updatedPayment.status },
      },
      metadata: {
        paymentAmount: currentPayment.amount?.toNumber() ?? 0,
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
      },
    });

    return json({
      success: true,
      payment: updatedPayment,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("Payment update error:", error);

    if (error instanceof z.ZodError) {
      return json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return json({ error: "Failed to update payment" }, { status: 500 });
  }
}

// ============= POST /api/admin/payments/[paymentId]/refund =============
export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    const headersList = await headers();
    const body = await req.json();

    const { paymentId } = await params;
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return json(
        { error: "Valid refund amount is required" },
        { status: 400 },
      );
    }

    if (!reason || reason.length < 10) {
      return json(
        { error: "Refund reason is required (min 10 characters)" },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

    if (amount > payment.amount) {
      return json(
        { error: "Refund amount cannot exceed payment amount" },
        { status: 400 },
      );
    }

    const isFullRefund = amount >= payment.amount;
    const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        notes: payment.notes
          ? `${payment.notes}\nRefund processed: ${reason}`
          : `Refund processed: ${reason}`,
      },
    });

    // Create audit log for the refund
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "REFUND_PAYMENT",
        entity: "PAYMENT",
        entityId: paymentId,
        metadata: {
          refundAmount: amount,
          isFullRefund,
          reason,
          originalAmount: payment.amount?.toNumber() ?? 0,
          processedBy: admin.name,
        },
        ipAddress: headersList.get("x-forwarded-for") || "unknown",
        userAgent: headersList.get("user-agent") || undefined,
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
        userEmail: payment.user.email,
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
    return json({ error: "Failed to process refund" }, { status: 500 });
  }
}

// ============= OPTIONS =============
export async function OPTIONS(): Promise<NextResponse> {
  return json(null, {
    status: 204,
    headers: {
      Allow: "GET, PATCH, POST, OPTIONS",
      "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
