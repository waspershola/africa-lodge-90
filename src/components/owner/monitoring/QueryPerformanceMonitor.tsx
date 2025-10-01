/**
 * Phase 6: Query Performance Monitor
 * Wrapper component to track query performance
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { trackSupabaseQuery } from '@/lib/performance-monitoring';

interface QueryPerformanceMonitorProps<T> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  queryName: string;
  enabled?: boolean;
  staleTime?: number;
  children: (result: UseQueryResult<T, Error>) => React.ReactNode;
}

/**
 * Wrapper component that monitors query performance
 */
export function QueryPerformanceMonitor<T>({
  queryKey,
  queryFn,
  queryName,
  enabled = true,
  staleTime,
  children,
}: QueryPerformanceMonitorProps<T>) {
  const result = useQuery({
    queryKey,
    queryFn: () => trackSupabaseQuery(queryName, queryFn(), { queryKey }),
    enabled,
    staleTime,
  });

  return <>{children(result)}</>;
}
