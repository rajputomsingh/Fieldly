// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: IS_DEVELOPMENT ? ["query", "error", "warn"] : ["error"],
    errorFormat: IS_PRODUCTION ? "minimal" : "pretty",
    transactionOptions: {
      maxWait: 10_000,
      timeout: 30_000,
      isolationLevel: "ReadCommitted",
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!IS_PRODUCTION) {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : "Unknown DB error",
    };
  }
}

if (!IS_PRODUCTION && typeof process !== "undefined") {
  const shutdown = async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // swallow — process is exiting
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}