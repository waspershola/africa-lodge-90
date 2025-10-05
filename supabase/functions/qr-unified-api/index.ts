import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRValidationRequest {
  qrToken: string;
  deviceInfo?: Record<string, any>;
}

interface RequestCreationPayload {
  sessionId: string;
  requestType: string;
  requestData: Record<string, any>;
  priority?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/qr-unified-api', '');

    // Route: POST /validate - Validate QR and create session
    if (path === '/validate' && req.method === 'POST') {
      const { qrToken, deviceInfo = {} } = await req.json() as QRValidationRequest;

      if (!qrToken) {
        return new Response(
          JSON.stringify({ error: 'QR token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call database function to validate and create session
      const { data, error } = await supabaseClient.rpc('validate_qr_and_create_session', {
        p_qr_token: qrToken,
        p_device_info: deviceInfo
      });

      if (error) {
        console.error('Validation error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to validate QR code', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data[0];
      if (!result.is_valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired QR code' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: {
            sessionId: result.session_id,
            tenantId: result.tenant_id,
            qrCodeId: result.qr_code_id,
            hotelName: result.hotel_name,
            roomNumber: result.room_number,
            services: result.services,
            expiresAt: result.expires_at
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /request - Create a new service request
    if (path === '/request' && req.method === 'POST') {
      const { sessionId, requestType, requestData, priority = 'normal' } = await req.json() as RequestCreationPayload;

      if (!sessionId || !requestType || !requestData) {
        return new Response(
          JSON.stringify({ error: 'Session ID, request type, and request data are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call database function to create request
      const { data, error } = await supabaseClient.rpc('create_unified_qr_request', {
        p_session_id: sessionId,
        p_request_type: requestType,
        p_request_data: requestData,
        p_priority: priority
      });

      if (error) {
        console.error('Request creation error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create request', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data[0];
      return new Response(
        JSON.stringify({
          success: true,
          request: {
            requestId: result.request_id,
            trackingNumber: result.tracking_number,
            createdAt: result.created_at
          }
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /request/:id - Get request status
    if (path.startsWith('/request/') && req.method === 'GET') {
      const requestId = path.split('/')[2];
      
      const { data, error } = await supabaseClient
        .from('qr_requests')
        .select('id, status, priority, request_type, request_data, created_at, completed_at, notes')
        .eq('id', requestId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Request not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, request: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /session/:sessionId/requests - Get all requests for a session
    if (path.match(/^\/session\/[^/]+\/requests$/) && req.method === 'GET') {
      const sessionId = path.split('/')[2];

      const { data, error } = await supabaseClient
        .from('qr_requests')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch requests', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, requests: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: GET /analytics/qr/:qrCodeId - Get analytics for a specific QR code
    if (path.match(/^\/analytics\/qr\/[^/]+$/) && req.method === 'GET') {
      const qrCodeId = path.split('/')[3];

      const { data, error } = await supabaseClient
        .from('qr_scan_logs')
        .select('scan_type, scanned_at, device_info')
        .eq('qr_code_id', qrCodeId)
        .order('scanned_at', { ascending: false })
        .limit(100);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch analytics', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, scans: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route not found
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unified QR API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});