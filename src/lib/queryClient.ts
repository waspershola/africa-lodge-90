import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized Query Client Configuration for Real-Time Data
 * 
 * - 0s stale time: Always consider data stale for instant freshness
 * - 5min garbage collection: Keeps data in memory for quick navigation
 * - Refetch on window focus: Auto-refresh on tab focus
 * - Refetch on mount: Always fetch latest data when component mounts
 * - Single retry: Fast failure detection
 * 
 * Trade-off: More API calls but zero stale data
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale for instant updates
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true, // Auto-refresh on tab focus
      refetchOnMount: true, // Always refetch when component mounts
      retry: 1, // Single retry for faster failure detection
    },
  },
});
