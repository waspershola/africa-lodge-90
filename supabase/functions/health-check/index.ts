import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: {
    supabase_url: boolean;
    supabase_service_role_key: boolean;
    resend_api_key: boolean;
  };
  services: {
    edge_functions: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[health-check] Health check request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables
    const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL');
    const hasServiceRoleKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const hasResendKey = !!Deno.env.get('RESEND_API_KEY');
    
    const allEnvVarsPresent = hasSupabaseUrl && hasServiceRoleKey;
    const emailConfigured = hasResendKey;
    
    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allEnvVarsPresent && emailConfigured) {
      status = 'healthy';
    } else if (allEnvVarsPresent) {
      status = 'degraded'; // Core services work, but email won't
    } else {
      status = 'unhealthy';
    }
    
    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      environment: {
        supabase_url: hasSupabaseUrl,
        supabase_service_role_key: hasServiceRoleKey,
        resend_api_key: hasResendKey,
      },
      services: {
        edge_functions: true, // If this runs, edge functions are working
      }
    };
    
    console.log('[health-check] Health check result:', result);
    
    return new Response(JSON.stringify(result), {
      status: status === 'unhealthy' ? 503 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('[health-check] Health check error:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
