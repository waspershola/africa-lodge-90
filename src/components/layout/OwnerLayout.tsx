import { 
  BarChart3, 
  Calendar, 
  BedDouble, 
  Users, 
  QrCode, 
  FileText, 
  UserCircle, 
  Battery, 
  Settings,
  DollarSign,
  CreditCard,
  Sparkles,
  User,
  MessageSquare
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { useTenantInfo } from '@/hooks/useTenantInfo';

const navigation = [
  { name: 'Dashboard', href: '/owner-dashboard/dashboard', icon: BarChart3 },
  { name: 'Hotel Configuration', href: '/owner-dashboard/configuration', icon: Settings },
  { name: 'Reservations', href: '/owner-dashboard/reservations', icon: Calendar },
  { name: 'Rooms & Rates', href: '/owner-dashboard/rooms', icon: BedDouble },
  { name: 'Guests', href: '/owner-dashboard/guests', icon: Users },
  { name: 'Housekeeping', href: '/owner-dashboard/housekeeping', icon: Sparkles },
  { name: 'Billing & Payments', href: '/owner-dashboard/billing', icon: CreditCard },
  { name: 'QR Manager', href: '/owner-dashboard/qr-manager', icon: QrCode },
  { name: 'QR Analytics', href: '/owner-dashboard/qr-analytics', icon: BarChart3 },
  { name: 'SMS Center', href: '/owner-dashboard/sms', icon: MessageSquare },
  { name: 'Reports', href: '/owner-dashboard/reports', icon: FileText },
  { name: 'Staff & Roles', href: '/owner-dashboard/staff', icon: UserCircle },
  { name: 'Financials', href: '/owner-dashboard/financials', icon: DollarSign },
  { name: 'Power & Fuel', href: '/owner-dashboard/utilities', icon: Battery },
  { name: 'Profile Settings', href: '/owner-dashboard/profile', icon: User },
];

export default function OwnerLayout() {
  const { data: tenantInfo } = useTenantInfo();
  const handleUpgradeClick = () => {
    // Navigate to billing/upgrade page
    window.location.href = '/owner-dashboard/billing';
  };

  return (
    <>
      {/* Trial Banner */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4">
          <TrialBanner onUpgradeClick={handleUpgradeClick} dismissible />
        </div>
      </div>
      
      <UnifiedDashboardLayout
        navigation={navigation}
        title={tenantInfo?.hotel_name || "Loading..."}
        subtitle="Hotel Owner Dashboard"
        backToSiteUrl="/"
        headerBadge={{
          icon: Settings,
          label: "Owner"
        }}
      />
    </>
  );
}