// app/api/health/redis/route.ts
import { NextResponse } from 'next/server';
import { redis, getHealth } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = getHealth();

  // If Redis isn't initialized, return immediately
  if (!redis) {
    return NextResponse.json(
      {
        status: 'unavailable',
        initialized: false,
        error: 'Redis client not initialized',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  // If circuit breaker is open, don't attempt ping
  if (health.circuitBreakerOpen) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        connected: false,
        error: 'Circuit breaker is open',
        ...health,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  // Perform real connectivity check
  const startTime = Date.now();

  try {
    const pingResult = await Promise.race([
      redis.ping(),
      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new Error('Ping timed out after 3s')),
          3000
        )
      ),
    ]);

    const latency = Date.now() - startTime;

    if (pingResult === 'PONG') {
      return NextResponse.json(
        {
          status: 'healthy',
          connected: true,
          latency,
          ...health,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'degraded',
        connected: false,
        latency,
        error: `Unexpected ping response: ${typeof pingResult}`,
        ...health,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let status: string = 'unhealthy';
    let diagnostic = errorMessage;

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      diagnostic = `DNS resolution failed: ${errorMessage}`;
    } else if (errorMessage.includes('timed out')) {
      status = 'degraded';
    }

    return NextResponse.json(
      {
        status,
        connected: false,
        latency,
        error: diagnostic,
        ...health,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}