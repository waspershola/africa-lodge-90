import { ReactNode } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Home, 
  Users, 
  ClipboardList, 
  DollarSign, 
  Settings,
  Receipt,
  Calendar,
  Shield,
  Activity,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ManagerLayout = () => {
  const location = useLocation();

  const navigationItems = [
    { path: 'dashboard', label: 'Overview', icon: Home },
    { path: 'operations', label: 'Operations', icon: Activity },
    { path: 'rooms', label: 'Room Status', icon: Users },
    { path: 'requests', label: 'Service Requests', icon: Bell, badge: '12' },
    { path: 'staff', label: 'Staff Management', icon: Users },
    { path: 'financials', label: 'Department Finance', icon: DollarSign },
    { path: 'receipts', label: 'Receipt Control', icon: Receipt },
    { path: 'events', label: 'Events & Packages', icon: Calendar },
    { path: 'compliance', label: 'Compliance', icon: Shield },
  ];

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    if (path === 'dashboard') {
      return currentPath === '/manager-dashboard' || currentPath === '/manager-dashboard/dashboard';
    }
    return currentPath.includes(`/manager-dashboard/${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      <div className="flex h-screen">
        {/* Sidebar */}
        <motion.aside 
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          className="w-72 bg-card border-r border-border shadow-sm"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <NavLink to="/">
                  <ArrowLeft className="h-4 w-4" />
                </NavLink>
              </Button>
              <div>
                <h1 className="font-bold text-xl text-foreground">Manager Dashboard</h1>
                <p className="text-sm text-muted-foreground">Operations Control Center</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={`/manager-dashboard/${item.path}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive || isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Quick Actions */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Receipt className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Broadcast Alert
                </Button>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;