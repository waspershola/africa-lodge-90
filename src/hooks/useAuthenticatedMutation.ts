import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Phase R.8: Authenticated Mutation Hook
 * 
 * Wraps useMutation to ensure Supabase token is valid before executing mutations.
 * Automatically refreshes expired tokens before critical operations.
 */
export function useAuthenticatedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      // Validate session and token before mutation
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast.error('Session expired. Please log in again.');
        throw new Error('Session expired');
      }

      // Check if token expires in less than 5 minutes
      const expiresAt = session.expires_at;
      if (!expiresAt) {
        console.warn('[useAuthenticatedMutation] No expiry in session');
      } else {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        // If token expires in <5 minutes, refresh it first
        if (timeUntilExpiry < 300) {
          console.log('[useAuthenticatedMutation] Token expiring soon - refreshing before mutation');
          
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[useAuthenticatedMutation] Token refresh failed:', refreshError);
            toast.error('Session refresh failed. Please log in again.');
            throw new Error('Token refresh failed');
          }
          
          console.log('[useAuthenticatedMutation] Token refreshed successfully');
        }
      }

      // Execute the original mutation with fresh token
      return mutationFn(variables);
    }
  });
}
