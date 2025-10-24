import { QueryClient } from '@tanstack/react-query';

/**
 * Professional Query Client Configuration
 * 
 * - 30s stale time: Data stays fresh for 30 seconds before refetching
 * - 5min garbage collection: Keeps data in memory for quick navigation
 * - No refetch on window focus: Prevents jarring re-renders
 * - Single retry: Fast failure detection
 * - Real-time updates: Supabase subscriptions handle invalidation
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - balanced freshness
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent constant refetching
      retry: 1, // Single retry for faster failure detection
    },
  },
});
