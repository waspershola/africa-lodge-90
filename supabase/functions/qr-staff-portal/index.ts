// Phase 2: QR Staff Portal API - Handles staff operations on requests
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
    const authHeader = req.headers.get('authorization');

    console.log('QR Staff Portal API:', { method, path });

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user info
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's tenant and role info
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userInfo) {
      return new Response(
        JSON.stringify({ error: 'User not found' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /staff/requests - Get requests for staff
    if (method === 'GET' && path[1] === 'staff' && path[2] === 'requests') {
      const team = url.searchParams.get('team');
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('qr_orders')
        .select(`
          *,
          qr_code:qr_codes(qr_token, room_id, rooms(room_number)),
          messages:qr_request_messages(id, sender_role, message, created_at, is_read),
          assigned_user:users(name, email)
        `)
        .eq('tenant_id', userInfo.tenant_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (team) {
        query = query.eq('assigned_team', team);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Role-based filtering
      if (userInfo.role === 'HOUSEKEEPING') {
        query = query.eq('assigned_team', 'housekeeping');
      } else if (userInfo.role === 'MAINTENANCE') {
        query = query.eq('assigned_team', 'maintenance');
      } else if (userInfo.role === 'POS') {
        query = query.eq('assigned_team', 'kitchen');
      }

      const { data: requests, error } = await query;

      if (error) {
        console.error('Requests fetch error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch requests' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(requests || []),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /staff/requests/:id/assign - Assign request to user
    if (method === 'POST' && path[1] === 'staff' && path[2] === 'requests' && path[3] && path[4] === 'assign') {
      const requestId = path[3];
      const body = await req.json();
      
      const { data: updated, error } = await supabase
        .from('qr_orders')
        .update({
          assigned_to: body.user_id || user.id,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('tenant_id', userInfo.tenant_id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to assign request' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create system message
      await supabase
        .from('qr_request_messages')
        .insert([{
          request_id: requestId,
          tenant_id: userInfo.tenant_id,
          sender_id: user.id,
          sender_role: 'staff',
          message: `Request assigned to staff member`,
          message_payload: { assigned_to: body.user_id || user.id }
        }]);

      return new Response(
        JSON.stringify(updated),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /staff/requests/:id/status - Update request status
    if (method === 'POST' && path[1] === 'staff' && path[2] === 'requests' && path[3] && path[4] === 'status') {
      const requestId = path[3];
      const body = await req.json();
      
      const updateData: any = {
        status: body.status,
        updated_at: new Date().toISOString()
      };

      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user.id;
      }

      const { data: updated, error } = await supabase
        .from('qr_orders')
        .update(updateData)
        .eq('id', requestId)
        .eq('tenant_id', userInfo.tenant_id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to update status' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create system message
      await supabase
        .from('qr_request_messages')
        .insert([{
          request_id: requestId,
          tenant_id: userInfo.tenant_id,
          sender_id: user.id,
          sender_role: 'staff',
          message: body.note || `Status updated to ${body.status}`,
          message_payload: { 
            status_change: body.status,
            eta_minutes: body.eta_minutes 
          }
        }]);

      return new Response(
        JSON.stringify(updated),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /staff/requests/:id/respond - Send message to guest
    if (method === 'POST' && path[1] === 'staff' && path[2] === 'requests' && path[3] && path[4] === 'respond') {
      const requestId = path[3];
      const body = await req.json();

      // Validate request exists and belongs to tenant
      const { data: request, error: reqError } = await supabase
        .from('qr_orders')
        .select('tenant_id')
        .eq('id', requestId)
        .eq('tenant_id', userInfo.tenant_id)
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
          tenant_id: userInfo.tenant_id,
          sender_id: user.id,
          sender_role: 'staff',
          message: body.message,
          message_payload: body.response_payload || {}
        }])
        .select()
        .single();

      if (msgError) {
        return new Response(
          JSON.stringify({ error: 'Failed to send message' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If updating status as well
      if (body.status) {
        await supabase
          .from('qr_orders')
          .update({
            status: body.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);
      }

      return new Response(
        JSON.stringify(message),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /staff/requests/:id/messages - Get messages for request
    if (method === 'GET' && path[1] === 'staff' && path[2] === 'requests' && path[3] && path[4] === 'messages') {
      const requestId = path[3];

      const { data: messages, error } = await supabase
        .from('qr_request_messages')
        .select(`
          *,
          sender:users(name, email)
        `)
        .eq('request_id', requestId)
        .eq('tenant_id', userInfo.tenant_id)
        .order('created_at', { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch messages' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(messages || []),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('QR Staff Portal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});