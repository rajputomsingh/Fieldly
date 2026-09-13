// app/api/cron/route.ts
//
// Consolidated cron endpoint for Vercel Hobby plan (single-cron limit).
//
// Jobs:
//   1. Auction settlement  -> runs every invocation (every 5 min)
//   2. Redis health check  -> runs once per day (first invocation after UTC midnight)
//
// Auth: requires Authorization: Bearer ${CRON_SECRET} when CRON_SECRET is set.
// Hobby plan limits functions to 10s, so keep work bounded and fast.

import { NextRequest, NextResponse } from "next/server";
import { autoSettleEndedAuctions } from "@/lib/services/auction-cron";
import { checkDatabaseHealth } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

type JobResult = {
  name: string;
  ok: boolean;
  details?: Record<string, unknown>;
  error?: string;
};

async function runAuctionSettlement(): Promise<JobResult> {
  try {
    const result = await autoSettleEndedAuctions();
    return { name: "auction_settlement", ok: true, details: result };
  } catch (error) {
    return {
      name: "auction_settlement",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runHealthCheck(): Promise<JobResult> {
  try {
    const [db, redis] = await Promise.all([
      checkDatabaseHealth(),
      pingRedis(),
    ]);
    return {
      name: "health_check",
      ok: db.ok,
      details: {
        database: db,
        redis: {
          ok: redis.ok,
          latencyMs: redis.latencyMs,
          errorKind: redis.errorKind,
        },
      },
    };
  } catch (error) {
    return {
      name: "health_check",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

let lastHealthRunUtcDate: string | null = null;

function shouldRunHealthCheck(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (lastHealthRunUtcDate === today) return false;
  lastHealthRunUtcDate = today;
  return true;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startedAt = new Date().toISOString();
  const jobs: JobResult[] = [];

  jobs.push(await runAuctionSettlement());

  if (shouldRunHealthCheck()) {
    jobs.push(await runHealthCheck());
  }

  const allOk = jobs.every((j) => j.ok);

  return NextResponse.json(
    {
      ok: allOk,
      startedAt,
      finishedAt: new Date().toISOString(),
      jobs,
    },
    { status: allOk ? 200 : 500 },
  );
}
