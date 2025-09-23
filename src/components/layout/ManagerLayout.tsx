import { 
  Home, 
  Users, 
  DollarSign, 
  Receipt,
  Calendar,
  Shield,
  Activity,
  Bell,
  Bed,
  Settings,
  QrCode,
  CheckCircle
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';
import { useTenantInfo } from '@/hooks/useTenantInfo';

const navigation = [
  { name: 'Overview', href: '/manager-dashboard/dashboard', icon: Home },
  { name: 'Operations', href: '/manager-dashboard/operations', icon: Activity },
  { name: 'Approvals', href: '/manager-dashboard/approvals', icon: CheckCircle },
  { name: 'Room Status', href: '/manager-dashboard/rooms', icon: Bed },
  { name: 'Service Requests', href: '/manager-dashboard/requests', icon: Bell },
  { name: 'Staff Management', href: '/manager-dashboard/staff', icon: Users },
  { name: 'QR Management', href: '/manager-dashboard/qr-codes', icon: QrCode },
  { name: 'Department Finance', href: '/manager-dashboard/financials', icon: DollarSign },
  { name: 'Receipt Control', href: '/manager-dashboard/receipts', icon: Receipt },
  { name: 'Events & Packages', href: '/manager-dashboard/events', icon: Calendar },
  { name: 'Compliance', href: '/manager-dashboard/compliance', icon: Shield },
];

export default function ManagerLayout() {
  const { data: tenantInfo } = useTenantInfo();
  
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title={tenantInfo?.hotel_name || "Loading..."}
      subtitle="Manager Operations Center"
      backToSiteUrl="/"
      headerBadge={{
        icon: Settings,
        label: "Manager"
      }}
    />
  );
}