import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard,
  Users,
  Calendar,
  Utensils,
  ClipboardList,
  BarChart3,
  Settings,
  QrCode,
  CreditCard,
  Wrench,
  Zap,
  Building2,
  ChevronLeft,
  ChevronRight,
  Hotel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getCurrentHotel } from "@/lib/api/mockAdapter";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "HOTEL_OWNER", "HOTEL_MANAGER"],
  },
  {
    name: "Reservations",
    href: "/reservations",
    icon: Calendar,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "FRONT_DESK"],
  },
  {
    name: "Front Desk",
    href: "/front-desk",
    icon: Users,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "FRONT_DESK"],
  },
  {
    name: "Room Service",
    href: "/room-service",
    icon: Utensils,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "POS_STAFF"],
  },
  {
    name: "QR Management",
    href: "/qr-export",
    icon: QrCode,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "ACCOUNTANT"],
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "FRONT_DESK", "ACCOUNTANT"],
  },
  {
    name: "Housekeeping",
    href: "/housekeeping",
    icon: ClipboardList,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "HOUSEKEEPING"],
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "MAINTENANCE"],
  },
  {
    name: "Power & Fuel",
    href: "/power",
    icon: Zap,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER", "MAINTENANCE"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["HOTEL_OWNER", "HOTEL_MANAGER"],
  },
];

const superAdminNavigation = [
  {
    name: "Tenants",
    href: "/sa/tenants",
    icon: Building2,
  },
  {
    name: "Plans & Billing",
    href: "/sa/billing",
    icon: CreditCard,
  },
  {
    name: "System Reports",
    href: "/sa/reports",
    icon: BarChart3,
  },
  {
    name: "Global Settings",
    href: "/sa/settings",
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const user = getCurrentUser();
  const hotel = getCurrentHotel();
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");

  const getNavigation = () => {
    if (isSuperAdmin) {
      return superAdminNavigation;
    }
    return navigation.filter(item => 
      item.roles.some(role => user.roles.includes(role))
    );
  };

  const navItems = getNavigation();

  return (
    <motion.div
      className="fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50"
      initial={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <Hotel className="h-8 w-8 text-sidebar-primary" />
            <div>
              <h1 className="font-playfair text-lg font-bold">
                {isSuperAdmin ? "Admin Panel" : hotel.name}
              </h1>
              {!isSuperAdmin && (
                <p className="text-xs text-sidebar-foreground/70 capitalize">
                  {hotel.plan} Plan
                </p>
              )}
            </div>
          </div>
        ) : (
          <Hotel className="h-8 w-8 text-sidebar-primary mx-auto" />
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            location.pathname.startsWith(item.href + '/');
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkActive }) => `
                flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                ${linkActive || isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }
              `}
            >
              <item.icon className={`h-5 w-5 ${isOpen ? '' : 'mx-auto'}`} />
              {isOpen && (
                <span className="font-medium">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/70">
            <p>{user.name}</p>
            <p>{user.email}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}