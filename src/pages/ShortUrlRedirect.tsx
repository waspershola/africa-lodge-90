import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * ShortUrlRedirect Component
 * 
 * Handles redirects for shortened URLs in the format /q/:shortCode
 * - Fetches the target URL from the url-shortener edge function
 * - Increments click count automatically via the edge function
 * - Redirects user to the full URL
 */
export default function ShortUrlRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        console.error('❌ [Short URL] No short code provided');
        navigate('/404', { replace: true });
        return;
      }

      console.log(`🔗 [Short URL] Redirecting short code: ${shortCode}`);

      try {
        // Call the edge function to get the target URL
        // The edge function handles the redirect logic and click tracking
        const { data, error } = await supabase.functions.invoke('url-shortener', {
          body: { shortCode },
          method: 'POST',
        });

        if (error) {
          console.error('❌ [Short URL] Error fetching target URL:', error);
          setError('Short URL not found or expired');
          setTimeout(() => navigate('/404', { replace: true }), 2000);
          return;
        }

        if (!data?.target_url) {
          console.error('❌ [Short URL] No target URL in response');
          setError('Invalid short URL');
          setTimeout(() => navigate('/404', { replace: true }), 2000);
          return;
        }

        console.log(`✅ [Short URL] Redirecting to: ${data.target_url}`);
        
        // Perform the redirect
        window.location.href = data.target_url;
      } catch (err) {
        console.error('❌ [Short URL] Exception:', err);
        setError('Failed to process short URL');
        setTimeout(() => navigate('/404', { replace: true }), 2000);
      }
    };

    handleRedirect();
  }, [shortCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="text-destructive text-4xl">⚠️</div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
        <p className="text-xs text-muted-foreground">
          Please wait while we load your destination
        </p>
      </div>
    </div>
  );
}
