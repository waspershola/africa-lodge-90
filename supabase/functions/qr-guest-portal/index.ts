// Phase 2: QR Guest Portal API - Handles guest requests and scanning
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/');
    const method = req.method;

    console.log('QR Guest Portal API:', { method, path });

    // GET /guest/qr/:slug - Get QR code info and available services
    if (method === 'GET' && path[1] === 'guest' && path[2] === 'qr' && path[3]) {
      const slug = path[3];
      
      // Get QR code info
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select(`
          *,
          room:rooms!inner(id, room_number, tenant_id),
          tenant:tenants!inner(hotel_name, logo_url, brand_colors, settings)
        `)
        .eq('qr_token', slug)
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        return new Response(
          JSON.stringify({ error: 'QR code not found or expired' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get available services for this tenant
      const { data: services, error: servicesError } = await supabase
        .from('qr_services')
        .select('*')
        .eq('tenant_id', qrCode.tenant_id)
        .order('name');

      if (servicesError) {
        console.error('Services fetch error:', servicesError);
      }

      const response = {
        tenant_id: qrCode.tenant_id,
        qr_code: {
          id: qrCode.id,
          room_id: qrCode.room_id,
          room_number: qrCode.room?.room_number,
          services: qrCode.services || [],
          token: qrCode.qr_token
        },
        hotel_config: {
          name: qrCode.tenant.hotel_name,
          logo: qrCode.tenant.logo_url,
          primary_color: qrCode.tenant.brand_colors?.primary || '#C9A96E',
          settings: qrCode.tenant.settings || {}
        },
        services: services || []
      };

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service-specific endpoints
    const serviceEndpoints = ['wifi-request', 'room-service', 'housekeeping', 'maintenance', 'digital-menu', 'events', 'feedback', 'front-desk-call'];
    
    if (method === 'POST' && path[1] === 'guest' && path[2] === 'qr' && path[3] && serviceEndpoints.includes(path[4])) {
      const slug = path[3];
      const serviceType = path[4];
      const body = await req.json();
      
      console.log('Creating service request:', { slug, serviceType, body });

      // Validate QR code exists and is active
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, tenant_id, room_id')
        .eq('qr_token', slug)
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        console.error('QR code validation error:', qrError);
        return new Response(
          JSON.stringify({ error: 'Invalid QR code' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Map service endpoints to internal service types
      const serviceTypeMap = {
        'wifi-request': 'wifi_support',
        'room-service': 'room_service', 
        'housekeeping': 'housekeeping',
        'maintenance': 'maintenance',
        'digital-menu': 'room_service',
        'events': 'concierge',
        'feedback': 'feedback',
        'front-desk-call': 'concierge'
      };

      const internalServiceType = serviceTypeMap[serviceType] || 'general';
      const guestSessionId = body.guest_session_id || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Determine assigned team based on service type
      const teamMap = {
        'wifi_support': 'IT',
        'room_service': 'Kitchen',
        'housekeeping': 'Housekeeping',
        'maintenance': 'Maintenance',
        'concierge': 'Front Desk',
        'feedback': 'Management',
        'general': 'Front Desk'
      };

      // Create the request
      const { data: newRequest, error: createError } = await supabase
        .from('qr_orders')
        .insert([{
          tenant_id: qrCode.tenant_id,
          qr_code_id: qrCode.id,
          room_id: qrCode.room_id,
          guest_session_id: guestSessionId,
          service_type: internalServiceType,
          request_details: body,
          status: 'pending',
          assigned_team: teamMap[internalServiceType],
          priority: body.priority || 1,
          notes: body.notes || body.message || `${serviceType} request from guest`,
          created_by_guest: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('Request creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create request', details: createError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If payment is required for room service, create folio charge
      if ((serviceType === 'room-service' || serviceType === 'digital-menu') && body.total_amount) {
        const { data: reservation } = await supabase
          .from('reservations')
          .select('id')
          .eq('room_id', qrCode.room_id)
          .eq('tenant_id', qrCode.tenant_id)
          .in('status', ['confirmed', 'checked_in'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (reservation) {
          const { data: folio } = await supabase
            .from('folios')
            .select('id')
            .eq('reservation_id', reservation.id)
            .eq('status', 'open')
            .single();

          if (folio) {
            await supabase
              .from('folio_charges')
              .insert([{
                tenant_id: qrCode.tenant_id,
                folio_id: folio.id,
                charge_type: internalServiceType,
                description: `QR ${serviceType.replace('-', ' ')} order`,
                amount: body.total_amount,
                reference_id: newRequest.id,
                reference_type: 'qr_order'
              }]);
          }
        }
      }

      const response = {
        request_id: newRequest.id,
        status: newRequest.status,
        assigned_team: newRequest.assigned_team,
        guest_session_id: guestSessionId,
        created_at: newRequest.created_at,
        service_type: serviceType
      };

      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Legacy endpoint - keep for backwards compatibility
    if (method === 'POST' && path[1] === 'guest' && path[2] === 'qr' && path[3] && path[4] === 'requests') {

      // If payment is required, create folio charge
      if (serviceInfo?.requires_payment && body.payload?.total_amount) {
        // Get or create folio for this room (simplified for this example)
        const { data: reservation } = await supabase
          .from('reservations')
          .select('id')
          .eq('room_id', qrCode.room_id)
          .eq('tenant_id', qrCode.tenant_id)
          .in('status', ['confirmed', 'checked_in'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (reservation) {
          const { data: folio } = await supabase
            .from('folios')
            .select('id')
            .eq('reservation_id', reservation.id)
            .eq('status', 'open')
            .single();

          if (folio) {
            await supabase
              .from('folio_charges')
              .insert([{
                tenant_id: qrCode.tenant_id,
                folio_id: folio.id,
                charge_type: body.request_type,
                description: `QR ${body.request_type} order`,
                amount: body.payload.total_amount,
                reference_id: newRequest.id,
                reference_type: 'qr_order'
              }]);
          }
        }
      }

      const response = {
        request_id: newRequest.id,
        status: newRequest.status,
        assigned_team: newRequest.assigned_team,
        guest_session_id: guestSessionId,
        created_at: newRequest.created_at
      };

      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /guest/qr/requests/:id - Get request status
    if (method === 'GET' && path[1] === 'guest' && path[2] === 'qr' && path[3] === 'requests' && path[4]) {
      const requestId = path[4];
      
      const { data: request, error } = await supabase
        .from('qr_orders')
        .select(`
          *,
          messages:qr_request_messages(*)
        `)
        .eq('id', requestId)
        .single();

      if (error || !request) {
        return new Response(
          JSON.stringify({ error: 'Request not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(request),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /guest/qr/requests/:id/messages - Add message to request
    if (method === 'POST' && path[1] === 'guest' && path[2] === 'qr' && path[3] === 'requests' && path[4] && path[5] === 'messages') {
      const requestId = path[4];
      const body = await req.json();

      // Validate request exists
      const { data: request, error: reqError } = await supabase
        .from('qr_orders')
        .select('tenant_id')
        .eq('id', requestId)
        .single();

      if (reqError || !request) {
        return new Response(
          JSON.stringify({ error: 'Request not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create message
      const { data: message, error: msgError } = await supabase
        .from('qr_request_messages')
        .insert([{
          request_id: requestId,
          tenant_id: request.tenant_id,
          sender_role: 'guest',
          message: body.message,
          message_payload: body.payload || {}
        }])
        .select()
        .single();

      if (msgError) {
        return new Response(
          JSON.stringify({ error: 'Failed to send message' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(message),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('QR Guest Portal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});