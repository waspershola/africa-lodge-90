import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, deviceSlug, authorizedBy } = await req.json();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Authenticate the user
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error('Invalid credentials');
    }

    const user = authData.user;
    if (!user) {
      throw new Error('Authentication failed');
    }

    // Get user details from the users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, tenant_id, role, is_active')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    if (!userData.is_active) {
      throw new Error('User account is inactive');
    }

    // Check if user already has an active shift
    const { data: existingShift, error: shiftCheckError } = await supabaseClient
      .from('shift_sessions')
      .select('id')
      .eq('staff_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (shiftCheckError) {
      throw new Error('Failed to check existing shifts');
    }

    if (existingShift) {
      throw new Error('User already has an active shift');
    }

    // Handle device registration if provided
    let deviceId = null;
    if (deviceSlug) {
      // Check if device exists, create if not
      const { data: existingDevice, error: deviceCheckError } = await supabaseClient
        .from('devices')
        .select('id')
        .eq('tenant_id', userData.tenant_id)
        .eq('slug', deviceSlug)
        .maybeSingle();

      if (deviceCheckError) {
        console.error('Device check error:', deviceCheckError);
      }

      if (existingDevice) {
        deviceId = existingDevice.id;
      } else {
        // Create new device
        const { data: newDevice, error: deviceCreateError } = await supabaseClient
          .from('devices')
          .insert({
            tenant_id: userData.tenant_id,
            slug: deviceSlug,
            location: `Front Desk Terminal`,
            metadata: { created_via: 'shift_terminal' }
          })
          .select('id')
          .single();

        if (deviceCreateError) {
          console.error('Device creation error:', deviceCreateError);
        } else {
          deviceId = newDevice.id;
        }
      }
    }

    // Create shift session
    const { data: shiftSession, error: shiftError } = await supabaseClient
      .from('shift_sessions')
      .insert({
        tenant_id: userData.tenant_id,
        staff_id: user.id,
        device_id: deviceId,
        authorized_by: authorizedBy,
        role: userData.role,
        status: 'active'
      })
      .select()
      .single();

    if (shiftError) {
      console.error('Shift creation error:', shiftError);
      throw new Error('Failed to create shift session');
    }

    // ✅ Log attendance record
    const { error: attendanceError } = await supabaseClient
      .from('attendance_log')
      .insert({
        tenant_id: userData.tenant_id,
        user_id: user.id,
        shift_session_id: shiftSession.id,
        check_in_time: new Date().toISOString(),
        device_slug: deviceSlug,
        status: 'present',
        metadata: {
          device_id: deviceId,
          authorized_by: authorizedBy
        }
      });

    if (attendanceError) {
      console.error('Attendance logging error:', attendanceError);
      // Don't fail the shift start if attendance logging fails
    }

    // Log the event in audit log
    await supabaseClient
      .from('audit_log')
      .insert({
        action: 'SHIFT_STARTED',
        resource_type: 'SHIFT_SESSION',
        resource_id: shiftSession.id,
        actor_id: user.id,
        tenant_id: userData.tenant_id,
        description: `Shift started for ${userData.role}`,
        metadata: {
          device_slug: deviceSlug,
          device_id: deviceId,
          authorized_by: authorizedBy,
          attendance_logged: !attendanceError
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        shift_session: shiftSession,
        message: 'Shift started successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Shift start error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start shift';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});