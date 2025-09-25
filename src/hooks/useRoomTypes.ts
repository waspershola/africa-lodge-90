import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";

export interface RoomType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  base_rate: number;
  max_occupancy: number;
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export function useRoomTypes() {
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["room-types", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      if (error) throw error;
      return data as RoomType[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateRoomType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (roomType: Omit<RoomType, "id" | "tenant_id" | "created_at" | "updated_at">) => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("room_types")
        .insert([{ ...roomType, tenant_id: tenantId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types", tenantId] });
      toast({
        title: "Success",
        description: "Room type created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating room type:", error);
      toast({
        title: "Error",
        description: "Failed to create room type",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRoomType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RoomType> & { id: string }) => {
      const { data, error } = await supabase
        .from("room_types")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types", tenantId] });
      toast({
        title: "Success",
        description: "Room type updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating room type:", error);
      toast({
        title: "Error",
        description: "Failed to update room type",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRoomType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("room_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types", tenantId] });
      toast({
        title: "Success",
        description: "Room type deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting room type:", error);
      toast({
        title: "Error",
        description: "Failed to delete room type",
        variant: "destructive",
      });
    },
  });
}