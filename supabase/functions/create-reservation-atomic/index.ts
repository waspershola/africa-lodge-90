import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://jsr.io/@supabase/supabase-js/2";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenant_id, guest_data, reservation_data } = await req.json();

    console.log('Creating atomic reservation:', { tenant_id, guest_data, reservation_data });

    // Validate required fields
    if (!tenant_id || !guest_data || !reservation_data) {
      throw new Error('Missing required fields: tenant_id, guest_data, or reservation_data');
    }

    // Call the atomic reservation creation function
    const { data, error } = await supabaseClient.rpc('create_reservation_atomic', {
      p_tenant_id: tenant_id,
      p_guest_data: {
        first_name: guest_data.guest_first_name,
        last_name: guest_data.guest_last_name,
        email: guest_data.guest_email,
        phone: guest_data.guest_phone,
        guest_id_number: guest_data.guest_id_number,
        nationality: guest_data.nationality,
        address: guest_data.address
      },
      p_reservation_data: {
        room_id: reservation_data.room_id,
        check_in_date: reservation_data.check_in_date,
        check_out_date: reservation_data.check_out_date,
        adults: reservation_data.adults || 1,
        children: reservation_data.children || 0,
        room_rate: reservation_data.room_rate,
        total_amount: reservation_data.total_amount
      }
    });

    if (error) {
      console.error('Database error:', error);
      throw new Error(error.message);
    }

    if (!data?.success) {
      console.error('Reservation creation failed:', data?.error);
      throw new Error(data?.error || 'Failed to create reservation');
    }

    console.log('Reservation created successfully:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      reservation_id: data.reservation_id,
      folio_id: data.folio_id,
      guest_id: data.guest_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in create-reservation-atomic function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});