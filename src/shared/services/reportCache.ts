/**
 * Report caching service for performance optimization
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum cache size
}

export interface ReportCacheMetrics {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class ReportCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL: number;
  private maxSize: number;
  private metrics = {
    hits: 0,
    misses: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  /**
   * Get cached data by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.metrics.hits = 0;
    this.metrics.misses = 0;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): ReportCacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance for global use
export const reportCache = new ReportCache({
  ttl: 10 * 60 * 1000, // 10 minutes for reports
  maxSize: 50,
});

// Utility functions for common caching patterns
export const CacheKeys = {
  report: (id: string) => `report:${id}`,
  reportPDF: (id: string) => `report:pdf:${id}`,
  reportStats: (filters: string) => `report:stats:${filters}`,
  userReports: (userId: string) => `user:reports:${userId}`,
  childReports: (childId: string) => `child:reports:${childId}`,
  practiceReports: (practiceId: string) => `practice:reports:${practiceId}`,
};

/**
 * Cache decorator for methods
 */
export function cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache first
      const cached = reportCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      reportCache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string): number {
  let removedCount = 0;
  const regex = new RegExp(pattern);

  for (const key of reportCache['cache'].keys()) {
    if (regex.test(key)) {
      reportCache.delete(key);
      removedCount++;
    }
  }

  return removedCount;
}
