import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { 
  getDashboardConfig, 
  usesUnifiedDashboard, 
  UserRole 
} from '@/config/dashboardConfig';
import { getBaseDashboardPath } from '@/utils/roleRouter';

interface DynamicDashboardShellProps {
  role?: UserRole;
}

export default function DynamicDashboardShell({ role: propRole }: DynamicDashboardShellProps) {
  const { user } = useAuth();
  const { data: tenantInfo } = useTenantInfo();

  // Determine the role to use (prop takes precedence, then user role)
  const userRole = propRole || (user?.role as UserRole);

  // Get dashboard configuration for this role
  const config = useMemo(() => {
    if (!userRole) return null;
    return getDashboardConfig(userRole);
  }, [userRole]);

  // Check if this role should use the unified dashboard
  const shouldUseUnified = useMemo(() => {
    if (!userRole) return false;
    return usesUnifiedDashboard(userRole);
  }, [userRole]);

  // Handle upgrade click for owner role (trial banner)
  const handleUpgradeClick = () => {
    const basePath = getBaseDashboardPath(userRole);
    window.location.href = `${basePath}/billing`;
  };

  // If no config or shouldn't use unified dashboard, render outlet directly
  if (!config || !shouldUseUnified) {
    return <Outlet />;
  }

  const showTrialBanner = config.layoutConfig?.showTrialBanner && userRole === 'OWNER';
  const hotelName = tenantInfo?.hotel_name || 'Loading...';

  return (
    <>
      {/* Trial Banner - Only for Owner */}
      {showTrialBanner && (
        <div className="bg-background border-b">
          <div className="container mx-auto px-4">
            <TrialBanner onUpgradeClick={handleUpgradeClick} dismissible />
          </div>
        </div>
      )}
      
      {/* Unified Dashboard Layout */}
      <UnifiedDashboardLayout
        navigation={config.navigation}
        title={hotelName}
        subtitle={config.subtitle}
        backToSiteUrl={config.layoutConfig?.backToSiteUrl || '/'}
        headerBadge={config.headerBadge}
      >
        <Outlet />
      </UnifiedDashboardLayout>
    </>
  );
}
