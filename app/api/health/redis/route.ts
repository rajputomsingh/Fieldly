// app/api/health/redis/route.ts
import { NextResponse } from "next/server";
import { getHealth, pingRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function GET() {
  const health = getHealth();
  const timestamp = new Date().toISOString();

  // Not initialized → 503 unavailable
  if (!health.initialized) {
    return NextResponse.json(
      {
        status: "unavailable",
        initialized: false,
        error: "Redis client not initialized",
        timestamp,
      },
      { status: 503 }
    );
  }

  // Circuit breaker open → skip ping, report unhealthy
  if (health.circuitBreakerOpen) {
    return NextResponse.json(
      {
        ...health,
        status: "unhealthy",
        connected: false,
        error: "Circuit breaker is open",
        timestamp,
      },
      { status: 503 }
    );
  }

  const ping = await pingRedis();

  // Production: redact internal error details
  const safeError = IS_PRODUCTION
    ? ping.errorKind === "dns"
      ? "DNS resolution failed"
      : ping.errorKind === "timeout"
        ? "Ping timed out"
        : ping.errorKind === "auth"
          ? "Authentication failed"
          : "Redis unreachable"
    : ping.error;

  if (ping.ok) {
    return NextResponse.json(
      {
        ...health,
        status: "healthy",
        connected: true,
        latency: ping.latencyMs,
        timestamp,
      },
      { status: 200 }
    );
  }

  const status = ping.errorKind === "timeout" ? "degraded" : "unhealthy";

  return NextResponse.json(
    {
      ...health,
      status,
      connected: false,
      latency: ping.latencyMs,
      error: safeError,
      ...(IS_PRODUCTION ? {} : { errorKind: ping.errorKind }),
      timestamp,
    },
    { status: 503 }
  );
}