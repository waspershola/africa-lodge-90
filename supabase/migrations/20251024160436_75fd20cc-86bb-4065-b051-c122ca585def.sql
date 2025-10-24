-- Add RLS policy to allow guests to read their own requests
-- This is critical for the guest portal to function properly

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Guests can view their requests via session" ON public.qr_requests;

-- Create policy allowing guests to read requests from their QR code's sessions
-- Strategy: Allow reading all requests for sessions that belong to the same QR code
CREATE POLICY "Guests can view their requests via session" 
ON public.qr_requests
FOR SELECT
USING (
  -- Allow reading if the request's session belongs to the same QR code
  -- that any of the user's current sessions belong to
  EXISTS (
    SELECT 1 
    FROM public.guest_sessions gs1
    JOIN public.guest_sessions gs2 ON gs1.qr_code_id = gs2.qr_code_id
    WHERE gs1.id = qr_requests.session_id
  )
);

-- Also ensure guests can see messages for their requests
DROP POLICY IF EXISTS "Guests can view messages for their requests" ON public.guest_messages;

CREATE POLICY "Guests can view messages for their requests"
ON public.guest_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.qr_requests qr
    JOIN public.guest_sessions gs ON qr.session_id = gs.id
    WHERE qr.id = guest_messages.qr_request_id
  )
);

-- Comment explaining the policy
COMMENT ON POLICY "Guests can view their requests via session" ON public.qr_requests IS 
'Allows guests to view all requests associated with the same QR code across different sessions. This enables cross-session visibility on mobile devices where sessions may change due to browser behavior.';
