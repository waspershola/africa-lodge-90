import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Route: GET /guest/qr/{token} - Validate QR code and get hotel info
    if (req.method === 'GET' && pathSegments[1] === 'guest' && pathSegments[2] === 'qr' && pathSegments[3]) {
      const token = pathSegments[3];
      
      console.log('Validating QR token:', token);
      
      // Call the validation function
      const { data: validationData, error: validationError } = await supabase
        .rpc('validate_qr_token_public', { token_input: token });
      
      if (validationError) {
        console.error('Validation error:', validationError);
        return new Response(
          JSON.stringify({ error: 'Invalid QR code' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (!validationData || !Array.isArray(validationData) || validationData.length === 0 || !validationData[0].is_valid) {
        console.log('QR code not valid or not found');
        return new Response(
          JSON.stringify({ error: 'QR code not found or expired' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const validation = validationData[0];
      
      // Get room information if available
      let roomNumber = null;
      if (validation.room_id) {
        const { data: roomData } = await supabase
          .from('rooms')
          .select('room_number')
          .eq('id', validation.room_id)
          .single();
        
        roomNumber = roomData?.room_number;
      }
      
      const response = {
        id: token,
        tenant_id: validation.tenant_id,
        room_id: validation.room_id,
        room_number: roomNumber,
        label: validation.label,
        hotel_name: validation.hotel_name,
        services: validation.services,
        is_active: true
      };
      
      console.log('Returning QR data:', response);
      
      return new Response(
        JSON.stringify(response),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Route: POST /guest/qr/{token}/requests - Create service request with session validation
    if (req.method === 'POST' && pathSegments[1] === 'guest' && pathSegments[2] === 'qr' && pathSegments[4] === 'requests') {
      const token = pathSegments[3];
      const body = await req.json();
      
      if (!body.session_id) {
        return new Response(
          JSON.stringify({ error: 'Session ID is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('Creating service request for token:', token, 'session:', body.session_id);

      // Validate session and increment request count
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('validate_guest_session', { 
          p_session_id: body.session_id, 
          p_increment_count: true 
        });

      if (sessionError || !sessionData || sessionData.length === 0 || !sessionData[0].is_valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const session = sessionData[0];

      // Check rate limiting
      const { data: sessionInfo } = await supabase
        .from('guest_sessions')
        .select('request_count')
        .eq('session_id', body.session_id)
        .single();

      const { data: settings } = await supabase
        .from('qr_session_settings')
        .select('max_requests_per_hour')
        .eq('tenant_id', session.tenant_id)
        .maybeSingle();

      const maxRequests = settings?.max_requests_per_hour || 50;
      
      if (sessionInfo && sessionInfo.request_count >= maxRequests) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please contact front desk.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      // Create QR order
      const { data: orderData, error: orderError } = await supabase
        .from('qr_orders')
        .insert({
          tenant_id: session.tenant_id,
          qr_code_id: session.qr_code_id,
          room_id: session.room_id,
          session_id: body.session_id,
          service_type: body.service_type,
          request_details: body.request_details || {},
          notes: body.notes,
          priority: body.priority || 0,
          status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return new Response(
          JSON.stringify({ error: 'Failed to create service request' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          request_id: orderData.id,
          message: 'Service request created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});