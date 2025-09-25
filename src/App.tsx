import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useFontManager } from "@/hooks/useFontManager";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import EmergencyAccessPage from "./pages/EmergencyAccessPage";
import { EmergencyRecoveryPage } from "./pages/super-admin/EmergencyRecoveryPage";
import FrontDeskDashboard from "./components/FrontDeskDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import { MultiTenantAuthProvider } from "./components/auth/MultiTenantAuthProvider";
import TenantAwareLayout from "./components/layout/TenantAwareLayout";
import OwnerLayout from "./components/layout/OwnerLayout";
import OwnerDashboardPage from "./pages/owner/Dashboard";
import Configuration from "./pages/owner/Configuration";
import StaffRoles from "./pages/owner/StaffRoles";
import Financials from "./pages/owner/Financials";
import Billing from "./pages/owner/Billing";
import EnhancedBilling from "./pages/owner/EnhancedBilling";
import StaffManagement from "./pages/owner/StaffManagement";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import QRManager from "./pages/owner/QRManager";
import QRPortal from "./pages/guest/QRPortal";
import Reports from "./pages/owner/Reports";
import Reservations from "./pages/owner/Reservations";
import Guests from "./pages/owner/Guests";
import Rooms from "./pages/owner/Rooms";
import Utilities from "./pages/owner/Utilities";
import Housekeeping from "./pages/owner/Housekeeping";
import { OwnerProfileSettings } from "./components/owner/profile/OwnerProfileSettings";
import QRAnalytics from "./pages/owner/QRAnalytics";
import QRExportPage from "./components/QRExportPage";
import ReportsInterface from "./components/ReportsInterface";
import ManagerLayout from "./components/layout/ManagerLayout";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerOperations from "./pages/manager/Operations";
import ManagerApprovals from "./pages/manager/Approvals";
import ManagerRoomStatus from "./pages/manager/RoomStatus";
import ManagerServiceRequests from "./pages/manager/ServiceRequests";
import ManagerStaffManagement from "./pages/manager/StaffManagement";
import ManagerQRManagement from "./pages/manager/QRManagement";
import ManagerDepartmentFinance from "./pages/manager/DepartmentFinance";
import ManagerReceiptControl from "./pages/manager/ReceiptControl";
import ManagerEventsPackages from "./pages/manager/EventsPackages";
import ManagerCompliance from "./pages/manager/Compliance";
import QRSettings from "./pages/owner/QRSettings";
import HousekeepingLayout from "./components/layout/HousekeepingLayout";
import HousekeepingDashboard from "./pages/housekeeping/Dashboard";
import HousekeepingTasks from "./pages/housekeeping/Tasks";
import HousekeepingAmenities from "./pages/housekeeping/Amenities";
import HousekeepingSupplies from "./pages/housekeeping/Supplies";
import HousekeepingOOSRooms from "./pages/housekeeping/OOSRooms";
import HousekeepingStaffAssignments from "./pages/housekeeping/StaffAssignments";
import HousekeepingAuditLogs from "./pages/housekeeping/AuditLogs";
import MaintenanceLayout from "./components/layout/MaintenanceLayout";
import MaintenanceDashboard from "./pages/maintenance/Dashboard";
import MaintenanceWorkOrders from "./pages/maintenance/WorkOrders";
import MaintenancePreventive from "./pages/maintenance/Preventive";
import MaintenanceSupplies from "./pages/maintenance/Supplies";
import MaintenanceAudit from "./pages/maintenance/Audit";
import POSLayout from "./components/layout/POSLayout";
import POSDashboard from "./pages/pos/Dashboard";
import POSKds from "./pages/pos/KDS";
import POSMenu from "./pages/pos/Menu";
import POSPayment from "./pages/pos/Payment";
import POSApprovals from "./pages/pos/Approvals";
import POSReports from "./pages/pos/Reports";
import POSSettings from "./pages/pos/Settings";
import HotelDashboard from "./pages/hotel/Dashboard";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";
import Dashboard from "./pages/sa/Dashboard";
import Tenants from "./pages/sa/Tenants";
import Services from "./pages/sa/Services";
import PricingConfig from "./pages/sa/PricingConfig";
import DemoConfig from "./pages/sa/DemoConfig";
import Templates from "./pages/sa/Templates";
import Roles from "./pages/sa/Roles";
import GlobalUsers from "./pages/sa/GlobalUsers";
import SystemOwners from "./pages/sa/SystemOwners";
import Support from "./pages/sa/Support";
import Wizard from "./pages/sa/Wizard";
import Plans from "./pages/sa/Plans";
import Policies from "./pages/sa/Policies";
import Advanced from "./pages/sa/Advanced";
import Audit from "./pages/sa/Audit";
import AuditLogs from "./pages/sa/AuditLogs";
import Metrics from "./pages/sa/Metrics";
import Backups from "./pages/sa/Backups";
import RealtimeMonitoring from "./pages/sa/RealtimeMonitoring";
import EmailProviders from "./pages/sa/EmailProviders";

const queryClient = new QueryClient();

// Font manager component to apply global font styles
const FontManager = () => {
  useFontManager();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MultiTenantAuthProvider>
        <FontManager />
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/emergency-access-portal" element={<EmergencyAccessPage />} />
          <Route path="/onboarding" element={
            <TenantAwareLayout>
              <OnboardingWizard />
            </TenantAwareLayout>
          } />
          <Route path="/guest/qr/:qrToken" element={<QRPortal />} />
          
          <Route path="/front-desk" element={
            <TenantAwareLayout requiredRole="FRONT_DESK">
              <FrontDeskDashboard />
            </TenantAwareLayout>
          } />
          <Route path="/reports" element={<ReportsInterface />} />
          
          {/* Owner Dashboard Routes */}
          <Route path="/owner-dashboard" element={
            <TenantAwareLayout requiredRole="OWNER">
              <OwnerLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<OwnerDashboardPage />} />
            <Route path="dashboard" element={<OwnerDashboardPage />} />
            <Route path="configuration" element={<Configuration />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="financials" element={<Financials />} />
            <Route path="billing" element={<EnhancedBilling />} />
            <Route path="qr-manager" element={<QRManager />} />
            <Route path="qr-settings" element={<QRSettings />} />
            <Route path="qr-analytics" element={<QRAnalytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="guests" element={<Guests />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="utilities" element={<Utilities />} />
            <Route path="housekeeping" element={<Housekeeping />} />
            <Route path="profile" element={<OwnerProfileSettings />} />
          </Route>
          <Route path="/qr-export" element={<QRExportPage />} />
          
          {/* Manager Dashboard Routes */}
          <Route path="/manager-dashboard" element={
            <TenantAwareLayout requiredRole="MANAGER">
              <ManagerLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<ManagerDashboard />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="operations" element={<ManagerOperations />} />
            <Route path="approvals" element={<ManagerApprovals />} />
            <Route path="rooms" element={<ManagerRoomStatus />} />
            <Route path="requests" element={<ManagerServiceRequests />} />
            <Route path="staff" element={<ManagerStaffManagement />} />
            <Route path="qr-codes" element={<ManagerQRManagement />} />
            <Route path="financials" element={<ManagerDepartmentFinance />} />
            <Route path="receipts" element={<ManagerReceiptControl />} />
            <Route path="events" element={<ManagerEventsPackages />} />
            <Route path="compliance" element={<ManagerCompliance />} />
          </Route>

          {/* Housekeeping Dashboard Routes */}
          <Route path="/housekeeping-dashboard" element={
            <TenantAwareLayout requiredRole="HOUSEKEEPING">
              <HousekeepingLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<HousekeepingDashboard />} />
            <Route path="dashboard" element={<HousekeepingDashboard />} />
            <Route path="tasks" element={<HousekeepingTasks />} />
            <Route path="amenities" element={<HousekeepingAmenities />} />
            <Route path="supplies" element={<HousekeepingSupplies />} />
            <Route path="oos-rooms" element={<HousekeepingOOSRooms />} />
            <Route path="staff" element={<HousekeepingStaffAssignments />} />
            <Route path="audit" element={<HousekeepingAuditLogs />} />
          </Route>

          {/* Maintenance Dashboard Routes */}
          <Route path="/maintenance-dashboard" element={
            <TenantAwareLayout requiredRole="MAINTENANCE">
              <MaintenanceLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<MaintenanceDashboard />} />
            <Route path="dashboard" element={<MaintenanceDashboard />} />
            <Route path="work-orders" element={<MaintenanceWorkOrders />} />
            <Route path="preventive" element={<MaintenancePreventive />} />
            <Route path="supplies" element={<MaintenanceSupplies />} />
            <Route path="audit" element={<MaintenanceAudit />} />
          </Route>

          {/* POS Dashboard Routes */}
          <Route path="/pos" element={
            <TenantAwareLayout requiredRole="POS">
              <POSLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<POSDashboard />} />
            <Route path="dashboard" element={<POSDashboard />} />
            <Route path="kds" element={<POSKds />} />
            <Route path="menu" element={<POSMenu />} />
            <Route path="payment" element={<POSPayment />} />
            <Route path="approvals" element={<POSApprovals />} />
            <Route path="reports" element={<POSReports />} />
            <Route path="settings" element={<POSSettings />} />
          </Route>

          {/* Hotel Dashboard Routes */}
          <Route path="/hotel/:tenantId/dashboard" element={<HotelDashboard />} />
          
          {/* Super Admin Routes */}
          <Route path="/sa" element={
            <TenantAwareLayout requiredRole="SUPER_ADMIN">
              <SuperAdminLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="services" element={<Services />} />
            <Route path="pricing-config" element={<PricingConfig />} />
            <Route path="demo-config" element={<DemoConfig />} />
            <Route path="templates" element={<Templates />} />
            <Route path="roles" element={<Roles />} />
            <Route path="global-users" element={<GlobalUsers />} />
            <Route path="system-owners" element={<SystemOwners />} />
            <Route path="support" element={<Support />} />
            <Route path="wizard" element={<Wizard />} />
            <Route path="plans" element={<Plans />} />
            <Route path="policies" element={<Policies />} />
            <Route path="advanced" element={<Advanced />} />
            <Route path="audit" element={<Audit />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="realtime-monitoring" element={<RealtimeMonitoring />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="backups" element={<Backups />} />
            <Route path="email-providers" element={<EmailProviders />} />
            <Route path="emergency-recovery" element={<EmergencyRecoveryPage />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </MultiTenantAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
