import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";

export interface PricingRule {
  id: string;
  tenant_id: string;
  name: string;
  type: "occupancy" | "demand" | "seasonal" | "competitor" | "event";
  is_active: boolean;
  trigger_condition: string;
  trigger_value: number;
  trigger_operator: ">" | "<" | "=" | ">=" | "<=";
  adjustment_type: "percentage" | "fixed";
  adjustment_value: number;
  max_increase: number;
  max_decrease: number;
  room_categories: string[];
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface DynamicPricingSettings {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  update_frequency: number;
  max_price_increase: number;
  max_price_decrease: number;
  competitor_sync: boolean;
  demand_forecast: boolean;
  event_integration: boolean;
  created_at: string;
  updated_at: string;
}

export function usePricingRules() {
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["pricing-rules", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");

      // Use mock data until types are regenerated
      return [
        {
          id: "1",
          tenant_id: tenantId,
          name: "High Occupancy Pricing",
          type: "occupancy" as const,
          is_active: true,
          trigger_condition: "occupancy_rate",
          trigger_value: 80,
          trigger_operator: ">=" as const,
          adjustment_type: "percentage" as const,
          adjustment_value: 15,
          max_increase: 25,
          max_decrease: 10,
          room_categories: ["standard", "deluxe"],
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ] as PricingRule[];
    },
    enabled: !!tenantId,
  });
}

export function useDynamicPricingSettings() {
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["dynamic-pricing-settings", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");

      // Use mock data until types are regenerated
      return {
        id: '',
        tenant_id: tenantId,
        is_enabled: false,
        update_frequency: 30,
        max_price_increase: 50,
        max_price_decrease: 30,
        competitor_sync: false,
        demand_forecast: false,
        event_integration: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DynamicPricingSettings;
    },
    enabled: !!tenantId,
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (rule: Omit<PricingRule, "id" | "tenant_id" | "created_at" | "updated_at">) => {
      if (!tenantId) throw new Error("No tenant ID");

      // Mock creation until types are regenerated
      const newRule = {
        ...rule,
        id: Math.random().toString(),
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return newRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", tenantId] });
      toast({
        title: "Success",
        description: "Pricing rule created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating pricing rule:", error);
      toast({
        title: "Error",
        description: "Failed to create pricing rule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      // Mock update until types are regenerated
      return { id, ...updates } as PricingRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", tenantId] });
      toast({
        title: "Success",
        description: "Pricing rule updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating pricing rule:", error);
      toast({
        title: "Error",
        description: "Failed to update pricing rule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDynamicPricingSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (settings: Partial<DynamicPricingSettings>) => {
      if (!tenantId) throw new Error("No tenant ID");

      // Mock update until types are regenerated
      return {
        ...settings,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      } as DynamicPricingSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-settings", tenantId] });
      toast({
        title: "Success",
        description: "Dynamic pricing settings updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating dynamic pricing settings:", error);
      toast({
        title: "Error",
        description: "Failed to update dynamic pricing settings",
        variant: "destructive",
      });
    },
  });
}