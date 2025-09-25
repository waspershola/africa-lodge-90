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

      if (error) {
        console.error('Invite user error:', error);
        // Try to extract more specific error information  
        const errorMessage = error.message || 'Edge Function returned a non-2xx status code';
        throw new Error(`Failed to invite user: ${errorMessage}`);
      }
      
      if (!data?.success) {
        const errorMessage = data?.error || 'Failed to create global user';
        console.error('Invite user failed:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('Global user created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create global user:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to create global user';
      if (error.message?.includes('already exists')) {
        errorMessage = 'A user with this email already exists';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'The selected role is not available';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
      // Use the suspend-user edge function for is_active changes
      if ('is_active' in updates) {
        const { data, error } = await supabase.functions.invoke('suspend-user', {
          body: { 
            user_id: userId,
            suspend: !updates.is_active,
            reason: updates.is_active ? 'Account reactivated by admin' : 'Account suspended by admin'
          }
        });

        if (error) {
          console.error('Suspend user error:', error);
          throw new Error(`Failed to update user status: ${error.message || 'Edge Function error'}`);
        }
        
        if (!data?.success) {
          const errorMessage = data?.error || 'Failed to update user status';
          console.error('Suspend user failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return data;
      }
      
      // For other updates, use direct database update
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
      console.error('Failed to update user:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to update user';
      if (error.message?.includes('platform owner')) {
        errorMessage = 'Cannot modify platform owner';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'User not found';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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

      if (error) {
        console.error('Delete user error details:', error);
        throw new Error(`Failed to delete user: ${error.message || 'Edge Function returned a non-2xx status code'}`);
      }
      
      if (!data?.success) {
        const errorMessage = data?.error || 'Failed to delete user';
        console.error('Delete user failed:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to delete user';
      if (error.message?.includes('platform owner')) {
        errorMessage = 'Cannot delete platform owner';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'User not found';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });
};

// Regular password reset - sends reset email link
export const useResetGlobalUserPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Get user email first, then send reset email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) {
        throw new Error('User not found');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw new Error(error.message || 'Failed to send reset email');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('Password reset email sent');
    },
    onError: (error: any) => {
      console.error('Failed to reset password:', error);
      toast.error(error.message || 'Failed to send password reset email');
    },
  });
};

// Temporary password reset - generates temp password and shows it
export const useResetToTempPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('send-temp-password', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to invoke temp password function');
      }
      
      if (!data?.success) {
        console.error('Function returned error:', data);
        throw new Error(data?.error || 'Failed to generate temporary password');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      if (data?.tempPassword) {
        toast.success(`Temporary password generated: ${data.tempPassword}`, {
          duration: 10000,
          description: 'Please share this with the user securely. They will be required to change it on next login.'
        });
      } else {
        toast.success('Temporary password generated successfully');
      }
    },
    onError: (error: any) => {
      console.error('Failed to generate temporary password:', error);
      
      let errorMessage = 'Failed to generate temporary password';
      if (error.message?.includes('platform owner')) {
        errorMessage = 'Cannot reset platform owner password';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'User not found';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });
};