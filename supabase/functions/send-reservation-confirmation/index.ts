import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReservationConfirmationRequest {
  reservationId: string;
  guestEmail: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationId, guestEmail, guestName, roomNumber, checkInDate, checkOutDate }: ReservationConfirmationRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailData = {
      from: "Hotel Management <noreply@resend.dev>",
      to: [guestEmail],
      subject: "Reservation Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Reservation Confirmation</h1>
          <p>Dear ${guestName},</p>
          <p>We are pleased to confirm your reservation:</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reservation ID:</strong> ${reservationId}</p>
            <p><strong>Room:</strong> ${roomNumber}</p>
            <p><strong>Check-in:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
          </div>
          <p>We look forward to welcoming you!</p>
          <p>Best regards,<br>The Hotel Management Team</p>
        </div>
      `,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status}`);
    }

    const emailResponse = await response.json();
    console.log("Reservation confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reservation-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);