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

    const { shiftSessionId, cashTotal, posTotal, handoverNotes, unresolvedItems = [] } = await req.json();

    if (!shiftSessionId) {
      throw new Error('Shift session ID is required');
    }

    // Get the shift session
    const { data: shiftSession, error: shiftError } = await supabaseClient
      .from('shift_sessions')
      .select('*')
      .eq('id', shiftSessionId)
      .eq('status', 'active')
      .single();

    if (shiftError || !shiftSession) {
      throw new Error('Active shift session not found');
    }

    // Update shift session
    const { data: updatedShift, error: updateError } = await supabaseClient
      .from('shift_sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        cash_total: cashTotal || 0,
        pos_total: posTotal || 0,
        handover_notes: handoverNotes,
        unresolved_items: unresolvedItems
      })
      .eq('id', shiftSessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Shift update error:', updateError);
      throw new Error('Failed to end shift session');
    }

    // Calculate shift duration
    const startTime = new Date(shiftSession.start_time);
    const endTime = new Date();
    const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 100) / 100;

    // Log the event in audit log
    await supabaseClient
      .from('audit_log')
      .insert({
        action: 'SHIFT_ENDED',
        resource_type: 'SHIFT_SESSION',
        resource_id: shiftSession.id,
        actor_id: shiftSession.staff_id,
        tenant_id: shiftSession.tenant_id,
        description: `Shift ended for ${shiftSession.role}`,
        metadata: {
          duration_hours: durationHours,
          cash_total: cashTotal,
          pos_total: posTotal,
          total_collected: (cashTotal || 0) + (posTotal || 0),
          has_unresolved_items: unresolvedItems.length > 0,
          unresolved_count: unresolvedItems.length
        }
      });

    // Generate shift summary for response
    const shiftSummary = {
      shift_id: shiftSession.id,
      staff_id: shiftSession.staff_id,
      role: shiftSession.role,
      start_time: shiftSession.start_time,
      end_time: updatedShift.end_time,
      duration_hours: durationHours,
      cash_total: cashTotal || 0,
      pos_total: posTotal || 0,
      total_collected: (cashTotal || 0) + (posTotal || 0),
      handover_notes: handoverNotes,
      unresolved_items: unresolvedItems
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        shift_session: updatedShift,
        shift_summary: shiftSummary,
        message: 'Shift ended successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Shift end error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to end shift';
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