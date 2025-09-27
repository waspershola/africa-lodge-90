import { ReactNode } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Menu, LogOut, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UnifiedDashboardLayoutProps {
  navigation: NavigationItem[];
  title: string;
  subtitle: string;
  backToSiteUrl?: string;
  headerBadge?: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  };
  children?: ReactNode;
}

function DashboardSidebar({ 
  navigation, 
  title, 
  backToSiteUrl = "/", 
  headerBadge 
}: Omit<UnifiedDashboardLayoutProps, 'subtitle' | 'children'>) {
  const location = useLocation();
  const { open, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();

  const handleMenuItemClick = (href: string) => {
    // Auto-close sidebar on mobile/tablet after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate(href);
  };

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-background">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/10"
          >
            <PanelLeft className="h-4 w-4 mr-2" />
            {open && "Menu"}
          </Button>
        </div>
        
        {headerBadge && (
          <div className="px-6 pb-4">
            <Badge 
              variant="secondary" 
              className="bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30"
            >
              <headerBadge.icon className="h-3 w-3 mr-1" />
              {headerBadge.label}
            </Badge>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-sidebar-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => handleMenuItemClick(item.href)}
                      className={`
                        text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-primary
                        data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary
                        data-[active=true]:font-semibold transition-colors cursor-pointer
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function UnifiedDashboardLayout({
  navigation,
  title,
  subtitle,
  backToSiteUrl,
  headerBadge,
  children
}: UnifiedDashboardLayoutProps) {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <DashboardSidebar 
          navigation={navigation}
          title={title}
          backToSiteUrl={backToSiteUrl}
          headerBadge={headerBadge}
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
            <div className="flex h-16 items-center gap-4 px-4 sm:p-6 lg:px-8">
              <SidebarTrigger className="lg:hidden" />

              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold display-heading text-gradient">
                  {title}
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {subtitle}
                </div>
                
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="h-8 px-3"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {children || <Outlet />}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}