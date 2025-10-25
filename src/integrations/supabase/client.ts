import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { requestRateLimiter } from '@/hooks/useRateLimiting';

const SUPABASE_URL = "https://dxisnnjsbuuiunjmzzqj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Use localStorage in development, httpOnly cookies in production via server
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Wrap with rate limiting
const originalFrom = supabaseClient.from.bind(supabaseClient);

supabaseClient.from = ((table: string) => {
  if (!requestRateLimiter.canMakeRequest()) {
    console.warn(`[Rate Limit] Blocking query to ${table}`);
    return {
      select: () => Promise.reject(new Error('Rate limit exceeded - please wait')),
      insert: () => Promise.reject(new Error('Rate limit exceeded - please wait')),
      update: () => Promise.reject(new Error('Rate limit exceeded - please wait')),
      delete: () => Promise.reject(new Error('Rate limit exceeded - please wait'))
    } as any;
  }
  
  return originalFrom(table);
}) as typeof supabaseClient.from;

export const supabase = supabaseClient;