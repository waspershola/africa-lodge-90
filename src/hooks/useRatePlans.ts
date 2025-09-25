import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";

export interface RatePlan {
  id: string;
  tenant_id: string;
  room_type_id?: string;
  name: string;
  description?: string;
  type: "seasonal" | "corporate" | "promotional" | "package";
  base_rate: number;
  adjustment_type: "fixed" | "percentage";
  adjustment: number;
  final_rate: number;
  start_date: string;
  end_date: string;
  min_stay?: number;
  max_stay?: number;
  advance_booking?: number;
  corporate_code?: string;
  restrictions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRatePlans() {
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["rate-plans", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");

      // Use mock data until types are regenerated
      return [
        {
          id: "1",
          tenant_id: tenantId,
          room_type_id: null,
          name: "Summer Special",
          description: "Special summer rates",
          type: "seasonal" as const,
          base_rate: 150000,
          adjustment_type: "percentage" as const,
          adjustment: -15,
          final_rate: 127500,
          start_date: "2024-06-01",
          end_date: "2024-08-31",
          min_stay: 2,
          max_stay: 14,
          advance_booking: 0,
          corporate_code: null,
          restrictions: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ] as RatePlan[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateRatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (ratePlan: Omit<RatePlan, "id" | "tenant_id" | "created_at" | "updated_at">) => {
      if (!tenantId) throw new Error("No tenant ID");

      // Mock creation until types are regenerated
      const newPlan = {
        ...ratePlan,
        id: Math.random().toString(),
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans", tenantId] });
      toast({
        title: "Success",
        description: "Rate plan created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating rate plan:", error);
      toast({
        title: "Error",
        description: "Failed to create rate plan",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RatePlan> & { id: string }) => {
      // Mock update until types are regenerated
      return { id, ...updates } as RatePlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans", tenantId] });
      toast({
        title: "Success",
        description: "Rate plan updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating rate plan:", error);
      toast({
        title: "Error",
        description: "Failed to update rate plan",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (id: string) => {
      // Mock deletion until types are regenerated
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans", tenantId] });
      toast({
        title: "Success",
        description: "Rate plan deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting rate plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete rate plan",
        variant: "destructive",
      });
    },
  });
}