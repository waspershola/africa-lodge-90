/**
 * Phase 6: Performance Monitoring
 * Track query performance and slow operations
 */

import { addBreadcrumb } from './sentry';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}

const SLOW_QUERY_THRESHOLD = 1000; // 1 second
const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * Track performance of an operation
 */
export async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();

  console.log(`[Performance] Starting: ${operation}`);

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    // Log metric
    logMetric({
      operation,
      duration,
      metadata: {
        ...metadata,
        success: true,
      },
    });

    // Warn on slow operations
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`[Performance] SLOW: ${operation} took ${duration.toFixed(2)}ms`, metadata);
      
      addBreadcrumb({
        category: 'performance',
        message: `Slow operation: ${operation}`,
        level: 'warning',
        data: {
          duration,
          ...metadata,
        },
      });
    } else {
      console.log(`[Performance] Completed: ${operation} in ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logMetric({
      operation,
      duration,
      metadata: {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    console.error(`[Performance] Failed: ${operation} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Log a performance metric
 */
function logMetric(metric: PerformanceMetric) {
  metrics.push(metric);

  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  if (metrics.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: 0,
      slowQueries: [],
    };
  }

  const durations = metrics.map(m => m.duration);
  const slowQueries = metrics.filter(m => m.duration > SLOW_QUERY_THRESHOLD);

  return {
    count: metrics.length,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
    slowQueries: slowQueries.map(m => ({
      operation: m.operation,
      duration: m.duration,
      metadata: m.metadata,
    })),
  };
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  metrics.length = 0;
}

/**
 * Track Supabase query performance
 */
export function trackSupabaseQuery<T>(
  queryName: string,
  query: Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return trackPerformance(
    `Supabase: ${queryName}`,
    () => query,
    metadata
  );
}
