import { 
  BarChart3, 
  ClipboardList, 
  QrCode, 
  Settings,
  User,
  Wrench,
  Sparkles
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/staff-dashboard/dashboard', icon: BarChart3 },
    { name: 'QR Requests', href: '/staff-dashboard/qr-requests', icon: QrCode },
  ];

  const roleSpecificNavigation = {
    HOUSEKEEPING: [
      { name: 'My Tasks', href: '/staff-dashboard/housekeeping', icon: Sparkles },
    ],
    MAINTENANCE: [
      { name: 'Work Orders', href: '/staff-dashboard/maintenance', icon: Wrench },
    ],
    FRONT_DESK: [
      { name: 'Front Desk', href: '/hotel-dashboard', icon: ClipboardList },
    ],
    // Add more role-specific navigation as needed
  };

  return [
    ...baseNavigation,
    ...(roleSpecificNavigation[role as keyof typeof roleSpecificNavigation] || []),
    { name: 'Profile', href: '/staff-dashboard/profile', icon: User },
  ];
};

export default function StaffLayout() {
  const { data: tenantInfo } = useTenantInfo();
  const { user } = useAuth();
  
  const navigation = getNavigationForRole(user?.role || 'STAFF');

  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title={tenantInfo?.hotel_name || "Loading..."}
      subtitle={`${user?.role || 'Staff'} Dashboard`}
      backToSiteUrl="/"
      headerBadge={{
        icon: User,
        label: user?.role || 'Staff'
      }}
    />
  );
}