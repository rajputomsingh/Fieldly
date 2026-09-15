// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: IS_DEVELOPMENT ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: IS_PRODUCTION ? 'minimal' : 'pretty',
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Preserve singleton in dev (hot reload) and in non-production runtime
if (!IS_PRODUCTION) {
  globalForPrisma.prisma = prisma
}

/**
 * Reusable DB health check for /api/health/db and readiness probes.
 * Returns a safe, serializable status — never throws.
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean
  latencyMs: number | null
  error?: string
}> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : 'Unknown DB error',
    }
  }
}

/**
 * Graceful shutdown — only in Node runtime (not edge).
 * Avoids noisy connection drops during deploys.
 */
if (!IS_PRODUCTION && typeof process !== 'undefined') {
  const shutdown = async () => {
    try {
      await prisma.$disconnect()
    } catch {
      // swallow — process is exiting
    }
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}