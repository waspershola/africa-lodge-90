// @ts-nocheck
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

      const { data, error } = await supabase
        .from("rate_plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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

      const { data, error } = await supabase
        .from("rate_plans")
        .insert({
          ...ratePlan,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from("rate_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from("rate_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
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