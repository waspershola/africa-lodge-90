import { 
  Home, 
  ClipboardList, 
  Package,
  FileText,
  Users,
  Settings,
  Clock,
  AlertTriangle
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';
import { useTenantInfo } from '@/hooks/useTenantInfo';

const navigation = [
  { name: 'Dashboard', href: '/housekeeping-dashboard/dashboard', icon: Home },
  { name: 'Tasks Board', href: '/housekeeping-dashboard/tasks', icon: ClipboardList },
  { name: 'Amenity Requests', href: '/housekeeping-dashboard/amenities', icon: Clock },
  { name: 'Supplies', href: '/housekeeping-dashboard/supplies', icon: Package },
  { name: 'OOS Rooms', href: '/housekeeping-dashboard/oos-rooms', icon: AlertTriangle },
  { name: 'Staff Assignments', href: '/housekeeping-dashboard/staff', icon: Users },
  { name: 'Audit Logs', href: '/housekeeping-dashboard/audit', icon: FileText },
];

export default function HousekeepingLayout() {
  const { data: tenantInfo } = useTenantInfo();
  
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title={tenantInfo?.hotel_name || "Loading..."}
      subtitle="Housekeeping Operations Center"
      backToSiteUrl="/"
      headerBadge={{
        icon: Settings,
        label: "Housekeeping"
      }}
    />
  );
}