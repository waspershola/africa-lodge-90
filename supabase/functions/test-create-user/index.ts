import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Test create user function started');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Environment check - URL:', supabaseUrl ? 'exists' : 'missing');
    console.log('Environment check - Service Key:', supabaseServiceKey ? 'exists' : 'missing');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);

    // Test basic functionality
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    console.log('Database test result:', { testData, testError });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test function working',
        dbTest: { testData, testError },
        receivedBody: requestBody
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Test function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Test function failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});