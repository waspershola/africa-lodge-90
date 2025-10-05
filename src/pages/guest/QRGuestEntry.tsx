import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function QRGuestEntry() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAndRedirect = async () => {
      if (!token) {
        setError('Invalid QR code: No token provided');
        return;
      }

      console.log('[QR ENTRY] Validating token:', token);

      try {
        // Call the edge function using the correct URL path format
        // The edge function expects: GET https://{project_id}.supabase.co/functions/v1/qr-guest-portal/guest/qr/{token}
        const SUPABASE_URL = "https://dxisnnjsbuuiunjmzzqj.supabase.co";
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8";
        
        const functionUrl = `${SUPABASE_URL}/functions/v1/qr-guest-portal/guest/qr/${token}`;
        
        console.log('[QR ENTRY] Calling edge function:', functionUrl);

        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY
          }
        });

        console.log('[QR ENTRY] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[QR ENTRY] Validation failed:', errorData);
          setError(errorData.error || 'Failed to validate QR code');
          return;
        }

        const data = await response.json();
        console.log('[QR ENTRY] Validation response:', data);

        if (!data.tenant_id) {
          console.error('[QR ENTRY] Invalid response - missing tenant_id:', data);
          setError('Invalid QR code response');
          return;
        }

        // Store validation data in sessionStorage for QRPortal to use
        sessionStorage.setItem('qr_validation', JSON.stringify({
          token,
          hotel_name: data.hotel_name,
          tenant_id: data.tenant_id,
          room_id: data.room_id,
          room_number: data.room_number,
          services: data.services,
          label: data.label,
          is_active: data.is_active,
          validated_at: new Date().toISOString()
        }));

        console.log('[QR ENTRY] Validation successful, redirecting to portal');
        
        // Redirect to the actual guest portal with the token
        navigate(`/guest/qr/${token}`, { replace: true });

      } catch (err) {
        console.error('[QR ENTRY] Validation error:', err);
        setError(`Failed to validate QR code: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    validateAndRedirect();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Validation Failed
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please request a new QR code from hotel staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Validating QR Code
        </h2>
        <p className="text-muted-foreground">
          Please wait while we verify your access...
        </p>
      </div>
    </div>
  );
}
