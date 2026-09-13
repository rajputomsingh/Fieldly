// app/api/cron/auction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { autoSettleEndedAuctions } from "@/lib/services/auction-cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron sends the CRON_SECRET as a Bearer token when the env var is set.
  // Reject anything else — this endpoint mutates data and must not be public.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
  }

  const startedAt = new Date().toISOString();

  try {
    const result = await autoSettleEndedAuctions();

    return NextResponse.json({
      ok: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[CRON_AUCTION]", error);
    return NextResponse.json(
      {
        ok: false,
        startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
