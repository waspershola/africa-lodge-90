import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Phase R.9: Token Validation Helper
 * 
 * Validates and refreshes Supabase auth token before critical operations.
 * Call this at the start of any async operation that requires authentication.
 * 
 * @throws Error if session is invalid or token refresh fails
 */
export async function validateAndRefreshToken(): Promise<void> {
  const startTime = Date.now();
  console.log('[TokenValidator] Starting validation', {
    timestamp: new Date().toISOString(),
    url: window.location.pathname
  });
  
  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.error('[TokenValidator] No valid session found');
    toast.error('Session expired. Please log in again.');
    throw new Error('Session expired');
  }

  // Check token expiry
  const expiresAt = session.expires_at;
  if (!expiresAt) {
    console.warn('[TokenValidator] No expiry timestamp in session');
    return; // Proceed anyway if no expiry info
  }

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  
  console.log('[TokenValidator] Token status:', {
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`,
    needsRefresh: timeUntilExpiry < 300
  });

  // If token expires in <5 minutes, refresh it first
  if (timeUntilExpiry < 300) {
    console.log('[TokenValidator] Token expiring soon - refreshing before operation');
    
    const { error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('[TokenValidator] Token refresh failed:', refreshError);
      toast.error('Session refresh failed. Please log in again.');
      throw new Error('Token refresh failed');
    }
    
    console.log('[TokenValidator] Token refreshed successfully');
  } else {
    console.log('[TokenValidator] Token is valid, proceeding with operation');
  }
  
  const duration = Date.now() - startTime;
  console.log('[TokenValidator] Validation complete', {
    duration: `${duration}ms`,
    tokenRefreshed: timeUntilExpiry < 300,
    timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`
  });
}
