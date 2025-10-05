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
      staleTime: 0, // Always consider data stale for QR codes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true, // Refetch when window gains focus
      retry: 1, // Single retry for faster failure detection
    },
  },
});
