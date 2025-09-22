import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GlobalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  is_platform_owner: boolean;
  force_reset: boolean;
}

export const useGlobalUsers = () => {
  return useQuery({
    queryKey: ['global-users'],
    queryFn: async (): Promise<GlobalUser[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .is('tenant_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching global users:', error);
        throw error;
      }

      return data || [];
    },
    retry: 2,
    staleTime: 30000,
  });
};

export const useCreateGlobalUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: {
      email: string;
      name: string;
      role: string;
      department?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          tenant_id: null, // Global user
          department: userData.department || null
        }
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create global user');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('Global user created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create global user:', error);
      toast.error(error.message || 'Failed to create global user');
    },
  });
};

export const useUpdateGlobalUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: Partial<Pick<GlobalUser, 'name' | 'role' | 'department' | 'is_active'>>; 
    }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .is('tenant_id', null)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
};

export const useDeleteGlobalUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId }
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete user');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
};

export const useResetGlobalUserPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('send-temp-password', {
        body: { user_id: userId }
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to reset password');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('Password reset email sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
};