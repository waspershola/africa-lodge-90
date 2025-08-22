import { 
  BarChart3, 
  Calendar, 
  BedDouble, 
  Users, 
  QrCode, 
  FileText, 
  UserCircle, 
  Battery, 
  Settings 
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';

const navigation = [
  { name: 'Dashboard', href: '/owner-dashboard/dashboard', icon: BarChart3 },
  { name: 'Hotel Configuration', href: '/owner-dashboard/configuration', icon: Settings },
  { name: 'Reservations', href: '/owner-dashboard/reservations', icon: Calendar },
  { name: 'Rooms & Rates', href: '/owner-dashboard/rooms', icon: BedDouble },
  { name: 'Guests', href: '/owner-dashboard/guests', icon: Users },
  { name: 'Room Service QR', href: '/owner-dashboard/qr-codes', icon: QrCode },
  { name: 'Reports', href: '/owner-dashboard/reports', icon: FileText },
  { name: 'Staff & Roles', href: '/owner-dashboard/staff', icon: UserCircle },
  { name: 'Power & Fuel', href: '/owner-dashboard/utilities', icon: Battery },
];

export default function OwnerLayout() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="Lagos Grand Hotel"
      subtitle="Hotel Owner Dashboard"
      backToSiteUrl="/"
      headerBadge={{
        icon: Settings,
        label: "Owner"
      }}
    />
  );
}