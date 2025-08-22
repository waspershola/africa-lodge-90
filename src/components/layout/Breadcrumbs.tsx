import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const routeNames: Record<string, string> = {
  "dashboard": "Dashboard",
  "reservations": "Reservations",
  "front-desk": "Front Desk",
  "room-service": "Room Service",
  "qr-export": "QR Management",
  "reports": "Reports",
  "payments": "Payments",
  "housekeeping": "Housekeeping",
  "maintenance": "Maintenance",
  "power": "Power & Fuel",
  "settings": "Settings",
  "sa": "Admin",
  "tenants": "Tenants",
  "billing": "Plans & Billing",
  "owner": "Owner Dashboard",
  "pos": "POS System",
  "public": "Public",
  "menu": "Menu",
  "order": "Order",
  "status": "Status",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || location.pathname === "/") {
    return null;
  }

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;

    return {
      name,
      path,
      isLast,
    };
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.path}>
          <ChevronRight className="h-4 w-4" />
          {breadcrumb.isLast ? (
            <span className="font-medium text-foreground">
              {breadcrumb.name}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}