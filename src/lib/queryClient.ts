import { QueryClient } from '@tanstack/react-query';

/**
 * Professional Query Client Configuration
 * 
 * - 30s stale time: Prevents unnecessary refetches
 * - 5min garbage collection: Keeps data in memory for quick navigation
 * - No refetch on window focus: Prevents jarring re-renders
 * - Single retry: Fast failure detection
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always fresh for real-time updates - let debounced invalidation control refetching
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent constant refetching
      retry: 1, // Single retry for faster failure detection
    },
  },
});
