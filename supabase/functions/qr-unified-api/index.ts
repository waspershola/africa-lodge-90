import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { signJWT, verifyJWT } from './jwt-utils.ts';
import { checkRateLimit, getClientIdentifier } from './rate-limiter.ts';
import { validateQRValidation, validateRequestCreation, sanitizeDeviceInfo, sanitizeRequestData } from './validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
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
    const clientIp = getClientIdentifier(req);

    // Route: POST /validate - Validate QR and create session
    if (path === '/validate' && req.method === 'POST') {
      // Rate limiting
      const rateCheck = checkRateLimit(clientIp, 'validate');
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded', 
            resetAt: rateCheck.resetAt 
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((rateCheck.resetAt! - Date.now()) / 1000))
            } 
          }
        );
      }

      const body = await req.json();
      
      // Input validation
      const validation = validateQRValidation(body);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: validation.errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { qrToken } = body;
      const deviceInfo = sanitizeDeviceInfo(body.deviceInfo || {});

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
        // Log failed attempt
        console.warn('Invalid QR validation attempt', { qrToken: qrToken.substring(0, 10) + '...', clientIp });
        return new Response(
          JSON.stringify({ error: 'Invalid or expired QR code' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sign JWT token
      const jwt = await signJWT({
        session_id: result.session_id,
        tenant_id: result.tenant_id,
        qr_code_id: result.qr_code_id
      });

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
          },
          token: jwt // JWT token for authentication
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: POST /request - Create a new service request
    if (path === '/request' && req.method === 'POST') {
      // Rate limiting
      const rateCheck = checkRateLimit(clientIp, 'request');
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded', 
            resetAt: rateCheck.resetAt 
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((rateCheck.resetAt! - Date.now()) / 1000))
            } 
          }
        );
      }

      // Verify JWT token
      const authHeader = req.headers.get('x-session-token');
      if (authHeader) {
        const jwtPayload = await verifyJWT(authHeader);
        if (!jwtPayload) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired session token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Route: POST /payment/charge - Record payment (pending verification)
      if (path === '/payment/charge' && req.method === 'POST') {
        const rateCheck = checkRateLimit(clientIp, 'request');
        if (!rateCheck.allowed) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded', resetAt: rateCheck.resetAt }),
            { 
              status: 429, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((rateCheck.resetAt! - Date.now()) / 1000))
              } 
            }
          );
        }

        const sessionToken = req.headers.get('x-session-token');
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ error: 'Session token required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify session token
        let sessionData;
        try {
          sessionData = await verifyJWT(sessionToken);
        } catch (error) {
          console.error('JWT verification failed:', error);
          return new Response(
            JSON.stringify({ error: 'Invalid or expired session' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const { amount, paymentMethod, reference, notes } = body;

        // Validate input
        if (!amount || amount <= 0 || amount > 1000000) {
          return new Response(
            JSON.stringify({ error: 'Invalid amount' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!['cash', 'card', 'wallet'].includes(paymentMethod)) {
          return new Response(
            JSON.stringify({ error: 'Invalid payment method' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get payment method ID
        const { data: paymentMethodRecord } = await supabaseClient
          .from('payment_methods')
          .select('id')
          .eq('tenant_id', sessionData.tenantId)
          .eq('type', paymentMethod)
          .eq('enabled', true)
          .maybeSingle();

        if (!paymentMethodRecord) {
          return new Response(
            JSON.stringify({ error: 'Payment method not available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create payment record (pending verification)
        const receiptId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const { data: payment, error: paymentError } = await supabaseClient
          .from('payments')
          .insert({
            tenant_id: sessionData.tenantId,
            folio_id: null,
            amount: amount,
            payment_method_id: paymentMethodRecord.id,
            reference_number: reference?.substring(0, 100) || receiptId,
            notes: notes?.substring(0, 500) || null,
            status: 'pending',
            payment_status: 'pending',
            is_verified: false,
          })
          .select('id, reference_number')
          .single();

        if (paymentError) {
          console.error('Payment creation error:', paymentError);
          return new Response(
            JSON.stringify({ error: 'Failed to record payment' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Payment recorded (pending verification):', {
          paymentId: payment.id,
          amount,
          method: paymentMethod,
          tenantId: sessionData.tenantId,
        });

        // 🔔 NOTIFICATION: Notify accounts/manager about payment
        try {
          await supabaseClient.from('staff_notifications').insert({
            tenant_id: sessionData.tenantId,
            title: 'Payment Received (Pending Verification)',
            message: `₦${amount.toLocaleString()} via ${paymentMethod} - Ref: ${payment.reference_number}`,
            notification_type: 'payment',
            priority: 'high',
            sound_type: 'alert-high',
            department: 'ACCOUNTS',
            recipients: ['ACCOUNTS', 'MANAGER'],
            reference_type: 'payment',
            reference_id: payment.id,
            actions: ['acknowledge', 'view_details', 'verify'],
            escalate_after_minutes: 5,
            metadata: {
              amount,
              payment_method: paymentMethod,
              reference: payment.reference_number,
              requires_verification: true
            }
          });
          console.log('✅ Payment notification sent:', payment.id);
        } catch (notifError) {
          console.error('⚠️ Failed to send payment notification (non-blocking):', notifError);
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            receiptId: payment.reference_number || payment.id,
            message: 'Payment submitted for verification',
            requiresVerification: true,
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      // Input validation
      const validation = validateRequestCreation(body);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: validation.errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { sessionId, requestType, priority = 'normal' } = body;
      const requestData = sanitizeRequestData(body.requestData);

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

      // 🔔 NOTIFICATION: Send real-time notification to staff
      // This notifies the appropriate department about the new guest request
      try {
        const { data: sessionData } = await supabaseClient
          .from('guest_sessions')
          .select('room_id, tenant_id')
          .eq('session_id', sessionId)
          .single();

        if (sessionData) {
          const { data: roomData } = await supabaseClient
            .from('rooms')
            .select('room_number')
            .eq('id', sessionData.room_id)
            .single();

          const department = requestType === 'food' || requestType === 'beverage' 
            ? 'RESTAURANT' 
            : 'HOUSEKEEPING';

          await supabaseClient.from('staff_notifications').insert({
            tenant_id: sessionData.tenant_id,
            title: `Guest Request - Room ${roomData?.room_number || 'Unknown'}`,
            message: `${requestType}: ${JSON.stringify(requestData).substring(0, 200)}`,
            notification_type: 'guest_request',
            priority: priority === 'urgent' ? 'high' : 'medium',
            sound_type: priority === 'urgent' ? 'alert-critical' : 'alert-high',
            department: department,
            recipients: [department],
            reference_type: 'qr_request',
            reference_id: result.request_id,
            actions: ['acknowledge', 'view_details', 'assign'],
            escalate_after_minutes: priority === 'urgent' ? 2 : 5,
            metadata: {
              request_type: requestType,
              room_number: roomData?.room_number,
              tracking_number: result.tracking_number
            }
          });

          console.log('✅ Notification sent for request:', result.request_id);
        }
      } catch (notifError) {
        console.error('⚠️ Failed to send notification (non-blocking):', notifError);
        // Don't fail the main request if notification fails
      }

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