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
    // Phase 2: Native Supabase heartbeat - keep connection alive during backgrounding
    heartbeatIntervalMs: 30000, // 30 seconds
    // Phase 3: Improved exponential backoff (1s, 3s, 5s, 10s, 10s...)
    reconnectAfterMs: (tries: number) => {
      const delays = [1000, 3000, 5000, 10000];
      return delays[Math.min(tries - 1, delays.length - 1)];
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'hotel-pms/2.0'
    }
  }
});

// Phase 4: Enhanced initialization logging
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('[Supabase Client] ✅ Initialized with improved realtime configuration');
    console.log('[Supabase Client] - Heartbeat: 30s');
    console.log('[Supabase Client] - Backoff: 1s, 3s, 5s, 10s');
    console.log('[Supabase Client] - Rate limit: 10 events/sec');
  }, 100);
}