import { validateAndRefreshToken } from '@/lib/auth-token-validator';
import { reinitializeSupabaseClient } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Phase 7.3: Protected Mutation Wrapper
 * 
 * Ensures all mutations execute with fresh, valid tokens:
 * 1. Validates and refreshes token if needed
 * 2. Reinitializes Supabase client to sync auth state
 * 3. Executes mutation with fresh context
 * 
 * @param mutateFn - The mutation function to execute
 * @param operationName - Human-readable operation name for logging/toasts
 * @returns Promise with mutation result
 */
export async function protectedMutate<T>(
  mutateFn: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  try {
    console.log(`[ProtectedMutate] Starting ${operationName}`);
    
    // Step 1: Validate and refresh token
    await validateAndRefreshToken();
    
    // Step 2: Reinitialize client to ensure it uses latest session
    await reinitializeSupabaseClient();
    
    // Step 3: Execute mutation
    const result = await mutateFn();
    
    console.log(`[ProtectedMutate] ${operationName} completed successfully`);
    return result;
    
  } catch (error: any) {
    console.error(`[ProtectedMutate] ${operationName} failed:`, error);
    
    // Check if error is auth-related
    if (error?.message?.includes('JWT') || 
        error?.message?.includes('expired') ||
        error?.message?.includes('Session')) {
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
