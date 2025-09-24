import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoomType {
  id: string;
  name: string;
  tenant_id: string;
  base_rate: number;
  max_occupancy: number;
  description?: string;
  amenities?: string[];
  created_at: string;
  updated_at: string;
}

export const useRoomTypes = () => {
  return useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('name');

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCreateRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomTypeData: Omit<RoomType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('room_types')
        .insert(roomTypeData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast.success('Room type created successfully');
    },
  });
};