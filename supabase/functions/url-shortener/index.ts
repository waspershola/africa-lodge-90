import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname;

    // Redirect: GET /q/:code
    if (path.match(/^\/q\/[a-zA-Z0-9]+$/)) {
      const code = path.split('/').pop();
      
      const { data, error } = await supabase
        .from('short_urls')
        .select('target_url, tenant_id')
        .eq('short_code', code)
        .maybeSingle();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Short URL not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment click count
      await supabase
        .from('short_urls')
        .update({ click_count: supabase.sql`click_count + 1` })
        .eq('short_code', code);

      return Response.redirect(data.target_url, 307);
    }

    // Create: POST /shorten
    if (path === '/shorten' && req.method === 'POST') {
      const { url: targetUrl, tenantId } = await req.json();

      if (!targetUrl || !tenantId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: url, tenantId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique short code
      let shortCode: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        const { data: codeData } = await supabase.rpc('generate_short_code', { length: 8 });
        shortCode = codeData as string;

        const { data: existing } = await supabase
          .from('short_urls')
          .select('short_code')
          .eq('short_code', shortCode)
          .maybeSingle();

        if (!existing) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate unique short code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: insertError } = await supabase
        .from('short_urls')
        .insert({
          short_code: shortCode,
          target_url: targetUrl,
          tenant_id: tenantId,
        });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const shortUrl = `${url.origin}/q/${shortCode}`;

      return new Response(
        JSON.stringify({ short_url: shortUrl, short_code: shortCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
