import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UnifiedDashboardLayoutProps {
  navigation: NavigationItem[];
  title: string;
  badge?: {
    text: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  backButton?: {
    text: string;
    href: string;
  };
}

export default function UnifiedDashboardLayout({ 
  navigation, 
  title, 
  badge,
  backButton 
}: UnifiedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Unified Luxury Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : '-100%',
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-primary))] transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:inset-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center gap-4 px-6 border-b border-[hsl(var(--sidebar-primary))]/20">
            {backButton && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(var(--sidebar-primary))] hover:bg-[hsl(var(--sidebar-primary))]/10"
              >
                <NavLink to={backButton.href}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {backButton.text}
                </NavLink>
              </Button>
            )}
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Badge */}
          {badge && (
            <div className="px-6 py-4">
              <Badge className="bg-[hsl(var(--sidebar-primary))]/20 text-[hsl(var(--sidebar-primary))] border-[hsl(var(--sidebar-primary))]/30 hover:bg-[hsl(var(--sidebar-primary))]/30">
                {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
                {badge.text}
              </Badge>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-[hsl(var(--sidebar-primary))]/20 text-[hsl(var(--sidebar-primary))] shadow-sm" 
                          : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/20 hover:text-[hsl(var(--sidebar-primary))]"
                      )}
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
      </motion.div>

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
              <div className="h-6 w-6 rounded bg-gradient-primary" />
              <h1 className="text-lg font-semibold display-heading text-gradient">
                {title}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Luxury Hotel Management
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}