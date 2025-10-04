import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { UserRole } from '@/config/dashboardConfig';
import { convertLegacyRoute, extractModuleFromPath } from '@/utils/roleRouter';
import { Loader2 } from 'lucide-react';

/**
 * Legacy Route Redirect Component
 * Automatically redirects users from old routes to new unified dashboard
 * 
 * Usage: Add ?useUnified=true to any legacy route to test the new system
 * Example: /owner-dashboard/rooms?useUnified=true
 */
export function LegacyRouteRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Check if unified routing is enabled via query param (for testing)
    const searchParams = new URLSearchParams(location.search);
    const useUnified = searchParams.get('useUnified') === 'true';

    if (!useUnified) {
      return; // Stay on legacy route
    }

    // Extract module from current path
    const module = extractModuleFromPath(location.pathname);
    
    if (module && user?.role) {
      // Redirect to new unified route
      const newPath = `/staff-dashboard/${module}`;
      console.log('[Route Migration] Redirecting from', location.pathname, 'to', newPath);
      navigate(newPath, { replace: true });
    }
  }, [location, navigate, user]);

  return null; // This component doesn't render anything
}

/**
 * Route Migration Banner
 * Shows a dismissible banner informing users about the new unified dashboard
 */
interface RouteMigrationBannerProps {
  onDismiss?: () => void;
}

export function RouteMigrationBanner({ onDismiss }: RouteMigrationBannerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleTryNew = () => {
    const module = extractModuleFromPath(location.pathname);
    if (module) {
      navigate(`/staff-dashboard/${module}`);
    }
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              New Unified Dashboard Available
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Experience our improved navigation and faster performance
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTryNew}
            className="text-xs font-medium text-primary hover:underline"
          >
            Try Now
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
