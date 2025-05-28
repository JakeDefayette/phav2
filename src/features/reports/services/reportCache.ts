import { ReportDataStructure } from '@/features/assessment/services/SurveyDataMapper';
import { TransformedChartData } from '@/shared/components/molecules/Charts/types';
import { PerformanceMonitor } from '@/shared/utils/performance';

/**
 * Cache entry with TTL (Time To Live)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * Configuration for cache behavior
 */
export interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxEntries: number; // Maximum number of entries before cleanup
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableStats: boolean; // Whether to track statistics
}

/**
 * High-performance caching service for report data with TTL and LRU eviction
 */
export class ReportCacheService {
  private static instance: ReportCacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private performanceMonitor: PerformanceMonitor;

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxEntries: 1000,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      enableStats: true,
      ...config,
    };

    this.stats = {
      totalEntries: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      memoryUsage: 0,
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.startCleanupTimer();
  }

  static getInstance(config?: Partial<CacheConfig>): ReportCacheService {
    if (!ReportCacheService.instance) {
      ReportCacheService.instance = new ReportCacheService(config);
    }
    return ReportCacheService.instance;
  }

  /**
   * Generate cache key for report data
   */
  private generateReportKey(
    assessmentId: string,
    reportType: string = 'standard'
  ): string {
    return `report:${assessmentId}:${reportType}`;
  }

  /**
   * Generate cache key for survey responses
   */
  private generateResponsesKey(assessmentId: string): string {
    return `responses:${assessmentId}`;
  }

  /**
   * Generate cache key for chart data
   */
  private generateChartKey(assessmentId: string, chartType?: string): string {
    return chartType
      ? `chart:${assessmentId}:${chartType}`
      : `chart:${assessmentId}`;
  }

  /**
   * Generate cache key for mapped survey data
   */
  private generateMappedDataKey(assessmentId: string): string {
    return `mapped:${assessmentId}`;
  }

  /**
   * Set cache entry with TTL
   */
  private set<T>(key: string, data: T, ttl?: number): void {
    const operationId = this.performanceMonitor.startOperation('cache_set', {
      key,
    });

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, entry);
    this.updateStats();

    // Trigger cleanup if we exceed max entries
    if (this.cache.size > this.config.maxEntries) {
      this.cleanup();
    }

    this.performanceMonitor.endOperation(operationId);
  }

  /**
   * Get cache entry if not expired
   */
  private get<T>(key: string): T | null {
    const operationId = this.performanceMonitor.startOperation('cache_get', {
      key,
    });

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      this.performanceMonitor.endOperation(operationId);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.missCount++;
      this.updateHitRate();
      this.performanceMonitor.endOperation(operationId);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hitCount++;
    this.updateHitRate();

    this.performanceMonitor.endOperation(operationId);
    return entry.data;
  }

  /**
   * Cache report data
   */
  cacheReportData(
    assessmentId: string,
    reportData: any,
    reportType: string = 'standard',
    ttl?: number
  ): void {
    const key = this.generateReportKey(assessmentId, reportType);
    this.set(key, reportData, ttl);
  }

  /**
   * Get cached report data
   */
  getCachedReportData(
    assessmentId: string,
    reportType: string = 'standard'
  ): any | null {
    const key = this.generateReportKey(assessmentId, reportType);
    return this.get(key);
  }

  /**
   * Cache survey responses
   */
  cacheSurveyResponses(
    assessmentId: string,
    responses: any[],
    ttl?: number
  ): void {
    const key = this.generateResponsesKey(assessmentId);
    this.set(key, responses, ttl);
  }

  /**
   * Get cached survey responses
   */
  getCachedSurveyResponses(assessmentId: string): any[] | null {
    const key = this.generateResponsesKey(assessmentId);
    return this.get(key);
  }

  /**
   * Cache chart data
   */
  cacheChartData(
    assessmentId: string,
    chartData: TransformedChartData[],
    chartType?: string,
    ttl?: number
  ): void {
    const key = this.generateChartKey(assessmentId, chartType);
    this.set(key, chartData, ttl);
  }

  /**
   * Get cached chart data
   */
  getCachedChartData(
    assessmentId: string,
    chartType?: string
  ): TransformedChartData[] | null {
    const key = this.generateChartKey(assessmentId, chartType);
    return this.get(key);
  }

  /**
   * Cache mapped survey data
   */
  cacheMappedData(
    assessmentId: string,
    mappedData: ReportDataStructure,
    ttl?: number
  ): void {
    const key = this.generateMappedDataKey(assessmentId);
    this.set(key, mappedData, ttl);
  }

  /**
   * Get cached mapped survey data
   */
  getCachedMappedData(assessmentId: string): ReportDataStructure | null {
    const key = this.generateMappedDataKey(assessmentId);
    return this.get(key);
  }

  /**
   * Invalidate cache entries for a specific assessment
   */
  invalidateAssessment(assessmentId: string): void {
    const operationId = this.performanceMonitor.startOperation(
      'cache_invalidate',
      { assessmentId }
    );

    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(assessmentId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateStats();

    this.performanceMonitor.endOperation(operationId);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    if (!this.config.enableStats) return;

    this.stats.totalEntries = this.cache.size;
    this.updateHitRate();

    // Calculate memory usage (rough estimate)
    this.stats.memoryUsage = this.cache.size * 1024; // Rough estimate

    // Find oldest and newest entries
    let oldest = Date.now();
    let newest = 0;

    for (const entry of this.cache.values()) {
      oldest = Math.min(oldest, entry.timestamp);
      newest = Math.max(newest, entry.timestamp);
    }

    this.stats.oldestEntry = oldest;
    this.stats.newestEntry = newest;
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? (this.stats.hitCount / total) * 100 : 0;
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      totalEntries: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Cleanup expired entries and enforce LRU eviction
   */
  private cleanup(): void {
    const operationId = this.performanceMonitor.startOperation('cache_cleanup');

    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        entriesToDelete.push(key);
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(key => this.cache.delete(key));

    // If still over limit, use LRU eviction
    if (this.cache.size > this.config.maxEntries) {
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.lastAccessed - b.lastAccessed
      );

      const toRemove = this.cache.size - this.config.maxEntries;
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.updateStats();
    this.performanceMonitor.endOperation(operationId);
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      this.startCleanupTimer();
    }
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Destroy cache instance (for testing)
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clearAll();
    ReportCacheService.instance = null as any;
  }

  /**
   * Alias for getCachedReportData (for backward compatibility)
   */
  getReport(cacheKey: string): any | null {
    return this.get(cacheKey);
  }

  /**
   * Alias for getCachedSurveyResponses (for backward compatibility)
   */
  getSurveyResponses(cacheKey: string): any[] | null {
    return this.get(cacheKey);
  }

  /**
   * Alias for getCachedMappedData (for backward compatibility)
   */
  getMappedData(cacheKey: string): ReportDataStructure | null {
    return this.get(cacheKey);
  }

  /**
   * Alias for cacheReportData (for backward compatibility)
   */
  cacheReport(cacheKey: string, reportData: any, ttl?: number): void {
    this.set(cacheKey, reportData, ttl);
  }

  /**
   * Alias for getCachedChartData (for backward compatibility)
   */
  getChartData(cacheKey: string): TransformedChartData[] | null {
    return this.get(cacheKey);
  }
}
