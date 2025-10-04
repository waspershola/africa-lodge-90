import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';
import ProtectedModule from './ProtectedModule';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { 
  getDashboardConfig, 
  usesUnifiedDashboard, 
  UserRole,
  NavigationItem 
} from '@/config/dashboardConfig';
import { getBaseDashboardPath } from '@/utils/roleRouter';
import { useMenuLoader } from '@/hooks/useMenuLoader';
import { getSafeRedirectPath } from '@/lib/accessControl';
import * as Icons from 'lucide-react';

interface DynamicDashboardShellProps {
  role?: UserRole;
  useJsonConfig?: boolean; // Toggle between TypeScript and JSON config
}

export default function DynamicDashboardShell({ 
  role: propRole, 
  useJsonConfig = false 
}: DynamicDashboardShellProps) {
  const { user } = useAuth();
  const { data: tenantInfo } = useTenantInfo();

  // Determine the role to use (prop takes precedence, then user role)
  const userRole = propRole || (user?.role as UserRole);

  // Load JSON config if enabled (with inheritance)
  const { modules: jsonModules, roleConfig: jsonRoleConfig } = useMenuLoader(
    useJsonConfig ? userRole : undefined
  );

  // Convert JSON modules to NavigationItem format
  const jsonNavigation = useMemo((): NavigationItem[] => {
    if (!useJsonConfig || !jsonModules) return [];
    
    return jsonModules.map(module => {
      // Dynamically resolve icon component
      const IconComponent = (Icons as any)[module.icon] || Icons.Circle;
      
      return {
        name: module.label,
        href: module.path,
        icon: IconComponent,
        module: module.id
      };
    });
  }, [useJsonConfig, jsonModules]);

  // Get TypeScript dashboard configuration
  const tsConfig = useMemo(() => {
    if (!userRole) return null;
    return getDashboardConfig(userRole);
  }, [userRole]);

  // Select active config based on mode
  const config = useJsonConfig 
    ? (jsonRoleConfig ? {
        displayName: jsonRoleConfig.title,
        subtitle: jsonRoleConfig.title,
        navigation: jsonNavigation,
        defaultRoute: jsonNavigation[0]?.href || '/',
        headerBadge: {
          icon: (Icons as any)[jsonRoleConfig.icon] || Icons.Settings,
          label: jsonRoleConfig.title
        },
        layoutConfig: {
          backToSiteUrl: '/',
          showTrialBanner: userRole === 'OWNER' // Add trial banner for owner in JSON mode
        }
      } : null)
    : tsConfig;

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

  // If no config or shouldn't use unified dashboard, render basic outlet
  if (!config || !shouldUseUnified) {
    return (
      <Routes>
        <Route index element={<Navigate to={getSafeRedirectPath(userRole)} replace />} />
        <Route path=":module" element={<ProtectedModule role={userRole} />} />
      </Routes>
    );
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
        <Routes>
          {/* Default redirect to first module */}
          <Route index element={<Navigate to={jsonNavigation[0]?.href.replace('/dashboard/', '') || 'dashboard'} replace />} />
          
          {/* Dynamic module routes */}
          {jsonNavigation.map((navItem) => {
            const moduleKey = navItem.module || navItem.href.split('/').pop();
            return (
              <Route
                key={moduleKey}
                path={moduleKey}
                element={<ProtectedModule moduleKey={moduleKey} role={userRole} />}
              />
            );
          })}
        </Routes>
      </UnifiedDashboardLayout>
    </>
  );
}
