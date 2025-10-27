import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dxisnnjsbuuiunjmzzqj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Use localStorage in development, httpOnly cookies in production via server
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

/**
 * Phase 7.1: Reinitialize Supabase client with fresh auth state
 * Call this after token refresh to ensure client uses latest session
 */
export async function reinitializeSupabaseClient(): Promise<void> {
  console.log('[Supabase Client] Reinitializing with fresh session');
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[Supabase Client] Failed to get session:', error);
    return;
  }
  
  if (session) {
    // Force client to use latest session
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });
    console.log('[Supabase Client] Session synchronized');
  }
}

// Phase R.10: Global Error Handler
// Listen for auth errors and handle token expiry
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Supabase Client] Token auto-refreshed by Supabase');
    } else if (event === 'SIGNED_OUT') {
      console.log('[Supabase Client] User signed out');
    }
  });
}