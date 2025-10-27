import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

export interface Guest {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  guest_id_number?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  id_type?: string;
  id_number?: string;
  vip_status: 'regular' | 'silver' | 'gold' | 'vip';
  total_stays: number;
  total_spent: number;
  last_stay_date?: string;
  preferences: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  guest_id_number?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  id_type?: string;
  id_number?: string;
  notes?: string;
}

export interface UpdateGuestData extends Partial<CreateGuestData> {
  id: string;
  vip_status?: Guest['vip_status'];
  preferences?: Record<string, any>;
}

// Main hook for guests data
export const useGuests = () => {
  return useQuery({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook to get a single guest
export const useGuest = (guestId: string) => {
  return useQuery({
    queryKey: ['guest', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!guestId,
  });
};

// Hook to search guests
export const useSearchGuests = (searchTerm: string) => {
  return useQuery({
    queryKey: ['guests', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.trim().length > 0,
  });
};

// Create guest mutation
export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (guestData: CreateGuestData) => {
      // Phase R.9: Validate token before critical operation
      await validateAndRefreshToken();
      
      // Get current user to add tenant_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('guests')
        .insert({
          ...guestData,
          tenant_id: user.user_metadata?.tenant_id,
          vip_status: 'regular',
          total_stays: 0,
          total_spent: 0,
          preferences: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({
        title: "Success",
        description: "Guest created successfully"
      });
    },
    onError: (error) => {
      console.error('Guest creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create guest",
        variant: "destructive"
      });
    }
  });
};

// Update guest mutation
export const useUpdateGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (guestData: UpdateGuestData) => {
      const { id, ...updateData } = guestData;
      const { data, error } = await supabase
        .from('guests')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest', data.id] });
      toast({
        title: "Success",
        description: "Guest updated successfully"
      });
    },
    onError: (error) => {
      console.error('Guest update error:', error);
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive"
      });
    }
  });
};

// Delete guest mutation
export const useDeleteGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({
        title: "Success",
        description: "Guest deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Guest deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive"
      });
    }
  });
};

// Get guest reservations
export const useGuestReservations = (guestId: string) => {
  return useQuery({
    queryKey: ['guest-reservations', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms!reservations_room_id_fkey (room_number, room_types:room_type_id (name))
        `)
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!guestId,
  });
};