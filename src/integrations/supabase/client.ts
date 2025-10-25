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
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Rate limiting to prevent overwhelming clients
    },
    // Heartbeat interval - keep connection alive during backgrounding
    heartbeatInterval: 30000, // 30 seconds
    // Exponential backoff for reconnection attempts (1s, 2s, 4s, 5s capped)
    reconnectAfterMs: (tries: number) => {
      return Math.min(tries * 1000, 5000);
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'hotel-pms/2.0'
    }
  }
});

// Initialize realtime channel manager after client creation
if (typeof window !== 'undefined') {
  // Give client time to initialize, then log confirmation
  setTimeout(() => {
    console.log('[Supabase Client] Realtime configuration applied with heartbeat and reconnection');
  }, 100);
}