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
  Wand2,
  Flag,
  Database,
  Video,
  Mail,
  Package
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';

const navigation = [
  { name: 'Dashboard', href: '/sa/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/sa/tenants', icon: Building2 },
  { name: 'Services', href: '/sa/services', icon: Layers },
  { name: 'Pricing Config', href: '/sa/pricing-config', icon: CreditCard },
  { name: 'Add-on Catalog', href: '/sa/addon-catalog', icon: Package },
  { name: 'Demo Config', href: '/sa/demo-config', icon: Video },
  { name: 'Templates', href: '/sa/templates', icon: Layers },
  { name: 'SMS Management', href: '/sa/sms-management', icon: Mail },
  { name: 'Roles', href: '/sa/roles', icon: Shield },
  { name: 'Global Users', href: '/sa/global-users', icon: UserCheck },
  { name: 'System Owners', href: '/sa/system-owners', icon: Shield },
  { name: 'Support', href: '/sa/support', icon: Headphones },
  { name: 'Backups', href: '/sa/backups', icon: Database },
  { name: 'Wizard', href: '/sa/wizard', icon: Wand2 },
  { name: 'Email Providers', href: '/sa/email-providers', icon: Mail },
  { name: 'Advanced', href: '/sa/advanced', icon: Settings },
  { name: 'Audit Logs', href: '/sa/audit', icon: Activity },
  { name: 'Realtime Monitor', href: '/sa/realtime-monitoring', icon: Activity },
  { name: 'Metrics', href: '/sa/metrics', icon: BarChart3 },
];

export default function SuperAdminLayout() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="LUXURYHOTELPRO Admin"
      subtitle="Platform Management"
      backToSiteUrl="/"
      headerBadge={{
        icon: Settings,
        label: "Super Admin"
      }}
    />
  );
}