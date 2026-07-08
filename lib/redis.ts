// lib/redis.ts
import { Redis } from "@upstash/redis";

// ============================================================
// Configuration
// ============================================================
const REDIS_TIMEOUT_MS = 3000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 30000;

// ============================================================
// Logging
// ============================================================
type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL: LogLevel = (process.env.REDIS_LOG_LEVEL as LogLevel) || "info";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const prefix = `[Redis:${level.toUpperCase()}]`;
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";

  const logMessage = `${timestamp} ${prefix} ${message}${dataStr}`;

  switch (level) {
    case "debug":
      console.debug(logMessage);
      break;
    case "info":
      console.info(logMessage);
      break;
    case "warn":
      console.warn(logMessage);
      break;
    case "error":
      console.error(logMessage);
      break;
  }
}

// ============================================================
// Metrics
// ============================================================
const metrics = {
  hits: 0,
  misses: 0,
  failures: 0,
  timeouts: 0,
};

function incrementMetric(key: keyof typeof metrics): void {
  metrics[key]++;
}

export function getMetrics() {
  return Object.freeze({ ...metrics });
}

// ============================================================
// Connection & Health
// ============================================================
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisInstance: Redis | null = null;
let consecutiveFailures = 0;
let lastFailureTime = 0;
let initialized = false;
let lastError: string | null = null;
let lastErrorTime: Date | null = null;

function isValidRedisUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return "invalid-url";
  }
}

function isCircuitBreakerOpen(): boolean {
  if (consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) return false;

  const timeSinceLastFailure = Date.now() - lastFailureTime;
  if (timeSinceLastFailure >= CIRCUIT_BREAKER_RESET_MS) {
    log("info", "Circuit breaker reset, attempting reconnection");
    consecutiveFailures = 0;
    lastError = null;
    lastErrorTime = null;
    return false;
  }

  return true;
}

// Initialize Redis
if (redisUrl && redisToken) {
  if (!isValidRedisUrl(redisUrl)) {
    log("warn", "Invalid Redis URL", { url: sanitizeUrl(redisUrl) });
  } else {
    try {
      redisInstance = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      initialized = true;
      log("info", "Redis initialized");
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      lastErrorTime = new Date();
      log("error", "Redis initialization failed", { error: lastError });
    }
  }
} else {
  log("info", "Redis credentials missing, running without cache", {
    hasUrl: !!redisUrl,
    hasToken: !!redisToken,
  });
}

export const redis = redisInstance;

// ============================================================
// Health Check
// ============================================================
export function getHealth() {
  return {
    initialized,
    healthy: redisInstance !== null && !isCircuitBreakerOpen(),
    consecutiveFailures,
    circuitBreakerOpen: isCircuitBreakerOpen(),
    lastError,
    lastErrorTime: lastErrorTime?.toISOString() || null,
    ...getMetrics(),
  };
}

// ============================================================
// Cache Keys & TTL
// ============================================================
export const CACHE_KEYS = {
  LISTING: (id: string, userId: string) => `listing:${id}:${userId}`,
  AUCTION: (id: string) => `auction:${id}`,
  USER: (id: string) => `user:${id}`,
} as const;

export const CACHE_TTL = {
  LISTING: 300,
  AUCTION: 2,
  USER: 3600,
} as const;

// ============================================================
// Availability Check
// ============================================================
export function isRedisAvailable(): boolean {
  if (!redisInstance) return false;
  if (isCircuitBreakerOpen()) return false;
  return true;
}

// ============================================================
// Timeout Wrapper
// ============================================================
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        incrementMetric("timeouts");
        reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs),
    ),
  ]);
}

// ============================================================
// Centralized Handlers
// ============================================================
function handleSuccess(): void {
  consecutiveFailures = 0;
  lastError = null;
  lastErrorTime = null;
}

function handleFailure(operation: string, error: unknown): void {
  consecutiveFailures++;
  incrementMetric("failures");
  lastFailureTime = Date.now();
  lastError = error instanceof Error ? error.message : "Unknown error";
  lastErrorTime = new Date();

  const isTimeout = lastError.includes("timed out");

  if (consecutiveFailures === 1) {
    log("warn", isTimeout ? "Redis timeout" : "Redis operation failed", {
      operation,
      error: lastError,
    });
  }

  if (consecutiveFailures === CIRCUIT_BREAKER_THRESHOLD) {
    log("error", "Redis unavailable, circuit breaker opening", {
      failures: consecutiveFailures,
      resetIn: `${CIRCUIT_BREAKER_RESET_MS / 1000}s`,
    });
  }
}

// ============================================================
// Safe Redis Operations
// ============================================================
export const safeRedis = {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null;

    try {
      const data = await withTimeout(
        redisInstance!.get<T>(key),
        REDIS_TIMEOUT_MS,
        "GET",
      );

      handleSuccess();

      if (data !== null && data !== undefined) {
        incrementMetric("hits");
        return data;
      }

      incrementMetric("misses");
      return null;
    } catch (error) {
      handleFailure("GET", error);
      return null;
    }
  },

  async setex<T>(key: string, ttl: number, value: T): Promise<boolean> {
    if (!isRedisAvailable()) return false;

    try {
      await withTimeout(
        redisInstance!.setex(key, ttl, value),
        REDIS_TIMEOUT_MS,
        "SETEX",
      );

      handleSuccess();
      return true;
    } catch (error) {
      handleFailure("SETEX", error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable()) return false;

    try {
      await withTimeout(redisInstance!.del(key), REDIS_TIMEOUT_MS, "DEL");

      handleSuccess();
      return true;
    } catch (error) {
      handleFailure("DEL", error);
      return false;
    }
  },

  async delMany(keys: string[]): Promise<boolean> {
    if (!isRedisAvailable() || keys.length === 0) return false;

    try {
      await withTimeout(
        redisInstance!.del(...keys),
        REDIS_TIMEOUT_MS,
        "DELMANY",
      );

      handleSuccess();
      return true;
    } catch (error) {
      handleFailure("DELMANY", error);
      return false;
    }
  },
};
