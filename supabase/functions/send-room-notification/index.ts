import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RoomNotificationRequest {
  roomNumber: string;
  guestName: string;
  notificationType: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomNumber, guestName, notificationType, message }: RoomNotificationRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailData = {
      from: "Hotel Management <noreply@resend.dev>",
      to: ["front-desk@hotel.com"], // This would be configurable
      subject: `Room ${roomNumber} Notification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Room Notification</h1>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Room:</strong> ${roomNumber}</p>
            <p><strong>Guest:</strong> ${guestName}</p>
            <p><strong>Type:</strong> ${notificationType}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Please take appropriate action as needed.</p>
          <p>Best regards,<br>Hotel Management System</p>
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
    console.log("Room notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-room-notification function:", error);
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