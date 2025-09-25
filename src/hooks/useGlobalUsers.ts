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
      console.log('Fetching global users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .is('tenant_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching global users:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} global users`);
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
      fullName: string;
      email: string;
      role: string;
      department?: string;
      generateTempPassword: boolean;
      sendEmail: boolean;
    }) => {
      console.log('Creating global user:', userData);

      const { data, error } = await supabase.functions.invoke('create-global-user', {
        body: userData
      });

      // Handle network/function invocation errors
      if (error) {
        console.error('Create user network error:', error);
        throw new Error('Network error - please try again');
      }
      
      // Handle application errors from the function
      if (data?.success === false) {
        throw new Error(data.error || 'Failed to create global user');
      }

      console.log('Global user created successfully');
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

export const useDeleteGlobalUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Deleting global user:', userId);

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId }
      });

      // Handle network/function invocation errors
      if (error) {
        console.error('Delete user network error:', error);
        throw new Error('Network error - please try again');
      }

      // Handle application errors from the function
      if (data?.success === false) {
        throw new Error(data.error || 'Failed to delete user');
      }

      console.log('User deleted successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Failed to delete user');
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
      console.log('Updating global user:', userId, updates);

      // Use the suspend-user edge function for is_active changes
      if ('is_active' in updates) {
        const { data, error } = await supabase.functions.invoke('suspend-user', {
          body: { 
            user_id: userId,
            action: updates.is_active ? 'unsuspend' : 'suspend',
            reason: updates.is_active ? 'Account reactivated by admin' : 'Account suspended by admin'
          }
        });

        if (error) {
          console.error('Error updating user status:', error);
          throw new Error(`Failed to update user status: ${error.message}`);
        }
        
        if (!data?.success) {
          const errorMessage = data?.error || 'Failed to update user status';
          console.error('Update user status failed:', errorMessage);
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

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      console.log('User updated successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update user:', error);
      toast.error(error.message || 'Failed to update user');
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Resetting password for user:', userId);

      // Get user email first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) {
        console.error('User not found for password reset:', userError);
        throw new Error('User not found');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Error sending password reset email:', error);
        throw new Error(error.message || 'Failed to send reset email');
      }

      console.log('Password reset email sent successfully');
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error: any) => {
      console.error('Failed to reset password:', error);
      toast.error(error.message || 'Failed to send password reset email');
    },
  });
};

export const useGenerateTempPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Generating temporary password for user:', userId);

      const { data, error } = await supabase.functions.invoke('generate-temp-password', {
        body: { user_id: userId }
      });

      // Handle network/function invocation errors
      if (error) {
        console.error('Generate temp password network error:', error);
        throw new Error('Network error - please try again');
      }

      // Handle application errors from the function
      if (data?.success === false) {
        throw new Error(data.error || 'Failed to generate temporary password');
      }

      console.log('Temporary password generated successfully');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      if (data?.tempPassword) {
        toast.success(`Temporary password: ${data.tempPassword}`, {
          duration: 15000,
          description: 'Please share this securely. User must change on next login.'
        });
      } else {
        toast.success('Temporary password generated successfully');
      }
    },
    onError: (error: any) => {
      console.error('Failed to generate temporary password:', error);
      toast.error(error.message || 'Failed to generate temporary password');
    },
  });
};