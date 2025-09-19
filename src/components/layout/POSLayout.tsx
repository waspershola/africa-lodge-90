import { 
  Home, 
  ClipboardList, 
  ChefHat,
  Menu,
  CreditCard,
  BarChart3,
  Settings,
  UtensilsCrossed,
  Clock
} from 'lucide-react';
import UnifiedDashboardLayout from './UnifiedDashboardLayout';

const navigation = [
  { name: 'Live Orders', href: '/pos/dashboard', icon: Home },
  { name: 'Kitchen Display', href: '/pos/kds', icon: ChefHat },
  { name: 'Menu Management', href: '/pos/menu', icon: Menu },
  { name: 'Payment & Billing', href: '/pos/payment', icon: CreditCard },
  { name: 'Reports', href: '/pos/reports', icon: BarChart3 },
  { name: 'Settings', href: '/pos/settings', icon: Settings },
];

export default function POSLayout() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="Lagos Grand Hotel"
      subtitle="Restaurant POS System"
      backToSiteUrl="/"
      headerBadge={{
        icon: UtensilsCrossed,
        label: "POS"
      }}
    />
  );
}