import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GuestHistoryEntry {
  id: string;
  action: string;
  description: string;
  created_at: string;
  actor_email?: string;
  metadata?: any;
}

export const useGuestHistory = (roomId?: string) => {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['guest-history', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('resource_type', 'ROOM')
        .eq('resource_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!roomId
  });

  return {
    history: history || [],
    isLoading,
    error
  };
};

export const useRoomNotes = () => {
  const [isLoading, setIsLoading] = useState(false);

  const addNote = async (roomId: string, note: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: noteError } = await supabase
        .from('audit_log')
        .insert([{
          action: 'room_note_added',
          resource_type: 'ROOM',
          resource_id: roomId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.user_metadata?.role,
          tenant_id: user.user_metadata?.tenant_id,
          description: `Note added: ${note}`,
          metadata: { note }
        }]);

      if (noteError) throw noteError;
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { addNote, isLoading };
};