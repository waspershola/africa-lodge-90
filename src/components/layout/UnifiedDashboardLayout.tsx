import { ReactNode } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const { open } = useSidebar();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-background">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/10"
          >
            <NavLink to={backToSiteUrl}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {open && "Back to Site"}
            </NavLink>
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
                      asChild
                      isActive={isActive}
                      className={`
                        text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-primary
                        data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary
                        data-[active=true]:font-semibold transition-colors
                      `}
                    >
                      <NavLink to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </NavLink>
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
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <DashboardSidebar 
          navigation={navigation}
          title={title}
          backToSiteUrl={backToSiteUrl}
          headerBadge={headerBadge}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
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
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="h-full"
            >
              {children || <Outlet />}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}