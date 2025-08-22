import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Shield, 
  Activity, 
  BarChart3,
  Menu,
  ArrowLeft,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/sa/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/sa/tenants', icon: Building2 },
  { name: 'Plans', href: '/sa/plans', icon: CreditCard },
  { name: 'Policies', href: '/sa/policies', icon: Shield },
  { name: 'Audit', href: '/sa/audit', icon: Activity },
  { name: 'Metrics', href: '/sa/metrics', icon: BarChart3 },
];

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center gap-4 px-6 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
              <NavLink to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Site
              </NavLink>
            </Button>
          </div>

          {/* Super Admin Badge */}
          <div className="px-6 py-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Settings className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-muted hover:text-primary'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold display-heading text-gradient">
                LuxuryHotelSaaS Admin
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Platform Management
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}