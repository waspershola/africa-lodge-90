import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * OLD QR PORTAL - DEPRECATED
 * 
 * This component is kept for backward compatibility only.
 * It immediately redirects to the new unified QR portal at /guest/qr/{token}.
 * 
 * Migration Note (2025-01-22):
 * - Old portal used qr_orders table
 * - Old portal didn't properly handle guest sessions
 * - New portal uses qr_requests table with proper session validation
 * 
 * Action Required: Remove this file after verifying all QR links use /guest/qr/ format
 */

export default function QRPortal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // IMMEDIATE REDIRECT TO NEW UNIFIED PORTAL
  useEffect(() => {
    if (slug) {
      console.log('🔄 [QR Migration] Redirecting from old portal to unified portal');
      console.log(`   Old: /qr-portal/${slug}`);
      console.log(`   New: /guest/qr/${slug}`);
      navigate(`/guest/qr/${slug}`, { replace: true });
    } else {
      console.error('❌ [QR Migration] No token provided, redirecting to 404');
      navigate('/404', { replace: true });
    }
  }, [slug, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting to guest portal...</p>
        <p className="text-xs text-muted-foreground">
          If you are not redirected, please contact support.
        </p>
      </div>
    </div>
  );
}
