import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
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

const AppSidebar = ({ 
  navigation, 
  badge, 
  backButton 
}: { 
  navigation: NavigationItem[];
  badge?: { text: string; icon?: React.ComponentType<{ className?: string }>; };
  backButton?: { text: string; href: string; };
}) => {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar className={!open ? "w-16" : "w-64"}>
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4">
          {backButton && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-primary/10 justify-start"
            >
              <NavLink to={backButton.href}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {open && backButton.text}
              </NavLink>
            </Button>
          )}
          
          {badge && (
            <Badge className="bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30 hover:bg-sidebar-primary/30 w-fit">
              {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
              {open && badge.text}
            </Badge>
          )}
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {open ? "Menu" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      className={cn(
                        isActive 
                          ? 'bg-sidebar-primary/20 text-sidebar-primary font-medium' 
                          : 'hover:bg-sidebar-accent/20 hover:text-sidebar-primary'
                      )}
                    >
                      <NavLink to={item.href} className="flex items-center gap-3 w-full p-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {open && <span>{item.name}</span>}
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
};

export default function UnifiedDashboardLayout({ 
  navigation, 
  title, 
  badge,
  backButton 
}: UnifiedDashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          navigation={navigation}
          badge={badge}
          backButton={backButton}
        />
        
        <main className="flex-1 bg-background">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
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
          <div className="p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}