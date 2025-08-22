import { 
  Building2, 
  CreditCard, 
  Shield, 
  Activity, 
  BarChart3,
  Settings,
  LayoutDashboard,
  Layers,
  UserCheck,
  Headphones,
  AlertTriangle,
  Wand2
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';

const navigation = [
  { name: 'Dashboard', href: '/sa/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/sa/tenants', icon: Building2 },
  { name: 'Templates', href: '/sa/templates', icon: Layers },
  { name: 'Roles', href: '/sa/roles', icon: Shield },
  { name: 'Global Users', href: '/sa/global-users', icon: UserCheck },
  { name: 'Support', href: '/sa/support', icon: Headphones },
  { name: 'Plans', href: '/sa/plans', icon: CreditCard },
  { name: 'Policies', href: '/sa/policies', icon: AlertTriangle },
  { name: 'Wizard', href: '/sa/wizard', icon: Wand2 },
  { name: 'Advanced', href: '/sa/advanced', icon: Settings },
  { name: 'Audit', href: '/sa/audit', icon: Activity },
  { name: 'Metrics', href: '/sa/metrics', icon: BarChart3 },
];

export default function SuperAdminLayout() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="LuxuryHotelSaaS Admin"
      subtitle="Platform Management"
      backToSiteUrl="/"
      headerBadge={{
        icon: Settings,
        label: "Super Admin"
      }}
    />
  );
}