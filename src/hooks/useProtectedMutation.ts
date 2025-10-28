import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { validateAndRefreshToken } from "@/lib/auth-token-validator";
import { reinitializeSupabaseClient } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Phase 2: Protected Mutation Hook
 * 
 * Wraps useMutation to ensure all mutations:
 * 1. Validate and refresh token before execution
 * 2. Reinitialize Supabase client to sync auth state
 * 3. Execute with fresh context
 * 4. Handle auth errors gracefully with user feedback
 * 
 * Usage:
 * ```
 * const mutation = useProtectedMutation(
 *   async (data) => {
 *     const { data, error } = await supabase.from('table').insert(data);
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 * ```
 */
export function useProtectedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      try {
        console.log('[ProtectedMutation] Validating session before mutation');
        
        // Step 1: Validate and refresh token
        await validateAndRefreshToken();
        
        // Step 2: **CRITICAL** - Reinitialize Supabase client to sync auth state
        await reinitializeSupabaseClient();
        
        // Step 3: Execute original mutation with fresh context
        const result = await mutationFn(variables);
        
        console.log('[ProtectedMutation] Mutation completed successfully');
        return result;
        
      } catch (error: any) {
        console.error('[ProtectedMutation] Mutation failed:', error);
        
        // Enhanced error detection for auth issues
        const isAuthError = 
          error?.message?.includes('JWT') || 
          error?.message?.includes('expired') ||
          error?.message?.includes('Session') ||
          error?.code === 'PGRST301' || // PostgREST auth error
          error?.status === 401;
        
        if (isAuthError) {
          toast.error('Session expired during operation', {
            description: 'Please log in again to continue.',
            action: {
              label: 'Login',
              onClick: () => window.location.href = '/auth'
            }
          });
        }
        
        throw error;
      }
    }
  });
}
