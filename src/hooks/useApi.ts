import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/api/mockAdapter';
import { useToast } from '@/hooks/use-toast';

// Generic API hooks using TanStack Query with mock adapter

export function useApiGet<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const { toast } = useToast();

  return useQuery({
    queryKey: [endpoint, params],
    queryFn: async () => {
      try {
        return await mockApi.get<T>(endpoint, params);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch data",
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: options?.cacheTime || 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        toast({
          title: "Connection Issue",
          description: `Retrying... (${failureCount + 1}/3)`,
          variant: "default",
        });
        return true;
      }
      return false;
    },
  });
}

export function useApiPost<TData, TVariables>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: TVariables) => mockApi.post<TData>(endpoint, data),
    onSuccess: (response) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }

      // Show success toast
      toast({
        title: "Success",
        description: "Operation completed successfully",
        variant: "default",
      });

      // Call custom success handler
      if (options?.onSuccess) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

export function useApiPatch<TData, TVariables>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TVariables }) => 
      mockApi.patch<TData>(endpoint, id, data),
    onSuccess: (response) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }

      toast({
        title: "Success",
        description: "Updated successfully",
        variant: "default",
      });

      if (options?.onSuccess) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Update failed",
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

export function useApiDelete(
  endpoint: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => mockApi.delete(endpoint, id),
    onSuccess: () => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }

      toast({
        title: "Success",
        description: "Deleted successfully",
        variant: "default",
      });

      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Delete failed",
        variant: "destructive",
      });

      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

// Specific hooks for common operations
export const useHotels = () => useApiGet('hotels');

export const useReservations = (params?: Record<string, any>) => 
  useApiGet('reservations', params);

export const useRoomServiceOrders = (params?: Record<string, any>) => 
  useApiGet('room_service_orders', params);

export const useMenuItems = (params?: Record<string, any>) => 
  useApiGet('menu_items', params);

export const useCreateReservation = () => 
  useApiPost('reservations', {
    invalidateQueries: ['reservations'],
  });

export const useUpdateReservation = () => 
  useApiPatch('reservations', {
    invalidateQueries: ['reservations'],
  });

export const useCreateRoomServiceOrder = () => 
  useApiPost('room_service_orders', {
    invalidateQueries: ['room_service_orders'],
  });

export const useUpdateRoomServiceOrder = () => 
  useApiPatch('room_service_orders', {
    invalidateQueries: ['room_service_orders'],
  });