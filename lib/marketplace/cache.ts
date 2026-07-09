import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// In-memory cache fallback when Redis is not available
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

// Try to connect to Redis, fall back to memory cache
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }
} catch {
  // Redis not available, using memory cache
}

class CacheService {
  private generateKey(prefix: string, params: Record<string, unknown>): string {
    const hash = crypto
      .createHash('sha1')
      .update(JSON.stringify(params))
      .digest('hex');
    return prefix + ":" + hash;
  }

  private async safeGet<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (redis) {
      try {
        const cached = await redis.get<string>(key);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      } catch {
        // Redis failed, fall through to memory
      }
    }
    
    // Memory fallback
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
    if (entry) {
      memoryCache.delete(key); // Clean expired entry
    }
    return null;
  }

  private async safeSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const ttlMs = ttlSeconds * 1000;
    
    // Always set memory cache (it always works)
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    // Try Redis if available
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
      } catch {
        // Redis failed but memory cache is set
      }
    }
  }

  private async safeDel(key: string): Promise<void> {
    memoryCache.delete(key);
    if (redis) {
      try { await redis.del(key); } catch { /* ignore */ }
    }
  }

  // Periodically clean expired memory entries
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    // Clean expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of memoryCache.entries()) {
          if (entry.expiresAt <= now) {
            memoryCache.delete(key);
          }
        }
      }, 5 * 60 * 1000);
    }
  }

  async getListing(listingId: string, userId?: string): Promise<unknown | null> {
    return this.safeGet(this.generateKey("listing", { id: listingId, userId: userId || "anonymous" }));
  }

  async setListing(listingId: string, data: unknown, userId?: string): Promise<void> {
    await this.safeSet(
      this.generateKey("listing", { id: listingId, userId: userId || "anonymous" }),
      data,
      300
    );
  }

  async getFeed(filters: unknown, pagination: unknown): Promise<unknown | null> {
    return this.safeGet(this.generateKey("feed", { filters, pagination }));
  }

  async setFeed(filters: unknown, pagination: unknown, data: unknown): Promise<void> {
    await this.safeSet(
      this.generateKey("feed", { filters, pagination }),
      data,
      60
    );
  }

  async getAuction(listingId: string): Promise<unknown | null> {
    return this.safeGet("auction:" + listingId);
  }

  async setAuction(listingId: string, data: unknown): Promise<void> {
    await this.safeSet("auction:" + listingId, data, 2);
  }

  async invalidateListing(listingId: string): Promise<void> {
    await this.safeDel(this.generateKey("listing", { id: listingId, userId: "anonymous" }));
    await this.safeDel("auction:" + listingId);
  }

  async invalidateFeed(): Promise<void> {
    // Clear all feed entries from memory cache
    const prefix = "feed:";
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
    if (redis) {
      try {
        const keys = await redis.keys(prefix + "*");
        if (keys.length > 0) await redis.del(...keys);
      } catch { /* ignore */ }
    }
  }

  async invalidateAuction(listingId: string): Promise<void> {
    await this.safeDel("auction:" + listingId);
  }

  async trackView(listingId: string, userId?: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const key = "view:" + listingId + ":" + (userId || "anonymous") + ":" + today;
    const viewed = await this.safeGet(key);
    if (!viewed) {
      await this.safeSet(key, "1", 86400);
      return true;
    }
    return false;
  }
}

export const marketplaceCache = new CacheService();
