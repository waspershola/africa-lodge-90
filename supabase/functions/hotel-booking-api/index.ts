import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  tenant_id: string;
  check_in: string;
  check_out: string;
  room_type_id?: string;
}

interface BookingRequest {
  tenant_id: string;
  guest_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    id_number?: string;
    nationality?: string;
  };
  reservation_data: {
    room_type_id: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    room_rate: number;
    total_amount: number;
    payment_status: 'pending' | 'confirmed' | 'partial';
    special_requests?: string;
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  try {
    switch (endpoint) {
      case 'availability':
        return await handleAvailability(req);
      case 'book':
        return await handleBooking(req);
      case 'confirm':
        return await handleConfirmation(req);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Hotel booking API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function handleAvailability(req: Request): Promise<Response> {
  const { tenant_id, check_in, check_out, room_type_id }: AvailabilityRequest = await req.json();

  const { data, error } = await supabase.rpc('fn_get_availability', {
    p_tenant_id: tenant_id,
    p_check_in_date: check_in,
    p_check_out_date: check_out,
    p_room_type_id: room_type_id || null
  });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      available_rooms: data || []
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleBooking(req: Request): Promise<Response> {
  const { tenant_id, guest_data, reservation_data }: BookingRequest = await req.json();

  // Create soft hold reservation
  const { data, error } = await supabase.rpc('create_reservation_atomic', {
    p_tenant_id: tenant_id,
    p_guest_data: guest_data,
    p_reservation_data: {
      ...reservation_data,
      status: reservation_data.payment_status === 'confirmed' ? 'confirmed' : 'soft_hold'
    }
  });

  if (error) throw error;

  if (!data.success) {
    throw new Error(data.error);
  }

  return new Response(
    JSON.stringify({
      success: true,
      reservation_id: data.reservation_id,
      booking_reference: `BK-${Date.now()}`,
      status: reservation_data.payment_status === 'confirmed' ? 'confirmed' : 'pending_payment'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleConfirmation(req: Request): Promise<Response> {
  const { reservation_id, payment_status, payment_reference } = await req.json();

  const { error } = await supabase
    .from('reservations')
    .update({
      status: payment_status === 'confirmed' ? 'confirmed' : 'cancelled',
      payment_reference,
      updated_at: new Date().toISOString()
    })
    .eq('id', reservation_id);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Reservation status updated successfully'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(handler);