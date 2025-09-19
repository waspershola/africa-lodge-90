import { 
  Home, 
  ClipboardList, 
  Calendar,
  Package,
  FileText,
  Settings,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';

const navigation = [
  { name: 'Dashboard', href: '/maintenance-dashboard/dashboard', icon: Home },
  { name: 'Work Orders', href: '/maintenance-dashboard/work-orders', icon: ClipboardList },
  { name: 'Preventive Schedule', href: '/maintenance-dashboard/preventive', icon: Calendar },
  { name: 'Supplies & Parts', href: '/maintenance-dashboard/supplies', icon: Package },
  { name: 'Audit Logs', href: '/maintenance-dashboard/audit', icon: FileText },
];

export default function MaintenanceLayout() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="Lagos Grand Hotel"
      subtitle="Maintenance Operations Center"
      backToSiteUrl="/"
      headerBadge={{
        icon: Wrench,
        label: "Maintenance"
      }}
    />
  );
}