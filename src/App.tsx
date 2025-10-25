import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useFontManager } from "@/hooks/useFontManager";
import { useSentry } from "@/hooks/useSentry";
import { PaymentMethodsProvider } from "@/contexts/PaymentMethodsContext";
import { SecurityDebugPanel } from "@/components/debug/SecurityDebugPanel";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import EmergencyAccessPage from "./pages/EmergencyAccessPage";
import { EmergencyRecoveryPage } from "./pages/super-admin/EmergencyRecoveryPage";
import FrontDeskDashboard from "./components/FrontDeskDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import { MultiTenantAuthProvider } from "./components/auth/MultiTenantAuthProvider";
import TenantAwareLayout from "./components/layout/TenantAwareLayout";
import OwnerDashboardPage from "./pages/owner/Dashboard";
import Configuration from "./pages/owner/Configuration";
import StaffRoles from "./pages/owner/StaffRoles";
import ShiftTerminal from "./pages/staff/ShiftTerminal";
import { ShiftIntegrationDashboard } from "./components/shift/ShiftIntegrationDashboard";
import Financials from "./pages/owner/Financials";
import Billing from "./pages/owner/Billing";
import EnhancedBilling from "./pages/owner/EnhancedBilling";
import StaffManagement from "./pages/owner/StaffManagement";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import QRManager from "./pages/owner/QRManager";
import QRPortal from "./pages/guest/QRPortal";
import RequestHistory from "./pages/guest/RequestHistory";
import { WalletManagementDashboard } from "./components/wallet/WalletManagementDashboard";
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
import MonitoringPage from "./pages/owner/Monitoring";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerOperations from "./pages/manager/Operations";
import ManagerApprovals from "./pages/manager/Approvals";
import ManagerRoomStatus from "./pages/manager/RoomStatus";
import ManagerServiceRequests from "./pages/manager/ServiceRequests";
import ManagerStaffManagement from "./pages/manager/StaffManagement";
import ManagerQRManagement from "./pages/manager/QRManagement";
import QRDebugPanel from "./pages/manager/QRDebugPanel";
import ManagerDepartmentFinance from "./pages/manager/DepartmentFinance";
import ManagerReceiptControl from "./pages/manager/ReceiptControl";
import ManagerEventsPackages from "./pages/manager/EventsPackages";
import ManagerCompliance from "./pages/manager/Compliance";
import SMSCenter from '@/pages/hotel/SMSCenter';
import QRSettings from "./pages/owner/QRSettings";
import HousekeepingDashboard from "./pages/housekeeping/Dashboard";
import HousekeepingTasks from "./pages/housekeeping/Tasks";
import HousekeepingAmenities from "./pages/housekeeping/Amenities";
import HousekeepingSupplies from "./pages/housekeeping/Supplies";
import HousekeepingOOSRooms from "./pages/housekeeping/OOSRooms";
import HousekeepingStaffAssignments from "./pages/housekeeping/StaffAssignments";
import HousekeepingAuditLogs from "./pages/housekeeping/AuditLogs";
import MaintenanceDashboard from "./pages/maintenance/Dashboard";
import MaintenanceWorkOrders from "./pages/maintenance/WorkOrders";
import MaintenancePreventive from "./pages/maintenance/Preventive";
import MaintenanceSupplies from "./pages/maintenance/Supplies";
import MaintenanceAudit from "./pages/maintenance/Audit";
import POSDashboard from "./pages/pos/Dashboard";
import POSKds from "./pages/pos/KDS";
import POSMenu from "./pages/pos/Menu";
import POSPayment from "./pages/pos/Payment";
import POSApprovals from "./pages/pos/Approvals";
import POSReports from "./pages/pos/Reports";
import POSSettings from "./pages/pos/Settings";
import HotelDashboard from "./pages/hotel/Dashboard";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";
import DynamicDashboardShell from "./components/layout/DynamicDashboardShell";
import ModuleLoader from "./components/layout/ModuleLoader";
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
import AddonCatalog from "./pages/sa/AddonCatalog";
import SMSManagement from "./pages/superadmin/SMSManagement";
import FeatureFlagsPage from "./pages/sa/FeatureFlags";
import StagingVerification from "./pages/sa/StagingVerification";
import SMSTemplates from "./pages/owner/SMSTemplates";
import QRSystemGuidePage from "./pages/owner/QRSystemGuide";
import QRSystemTestPage from "./pages/owner/QRSystemTest";

import SupportAdminLayout from "./components/layout/SupportAdminLayout";
import SupportStaffLayout from "./components/layout/SupportStaffLayout";
import SupportAdminDashboard from "./pages/support-admin/Dashboard";
import SupportStaffDashboard from "./pages/support-staff/Dashboard";
import MenuPreview from "./pages/debug/MenuPreview";
import PaymentVerification from "./pages/staff/PaymentVerification";
import QRRequests from "./pages/staff/QRRequests";
import ShortUrlRedirect from "./pages/ShortUrlRedirect";

// Font manager component to apply global font styles
const FontManager = () => {
  useFontManager();
  return null;
};

// Phase 6: Initialize Sentry monitoring
const SentryMonitor = () => {
  useSentry();
  return null;
};

// Health Monitor + Connection Manager initialization
import { supabaseHealthMonitor } from './lib/supabase-health-monitor';
import { connectionManager } from './lib/connection-manager';
import { useEffect } from 'react';

const HealthMonitor = () => {
  useEffect(() => {
    supabaseHealthMonitor.start();
    // ConnectionManager automatically initializes on import
    return () => {
      supabaseHealthMonitor.stop();
      connectionManager.destroy();
    };
  }, []);
  return null;
};

// Wrapper to ensure auth context is available before PaymentMethodsProvider
const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <PaymentMethodsProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </PaymentMethodsProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MultiTenantAuthProvider>
      <AppProviders>
        <FontManager />
        <SentryMonitor />
        <HealthMonitor />
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/emergency-access-portal" element={<EmergencyAccessPage />} />
          <Route path="/onboarding" element={
            <TenantAwareLayout>
              <OnboardingWizard />
            </TenantAwareLayout>
          } />
          <Route path="/guest/qr/:qrToken" element={<QRPortal />} />
          <Route path="/guest/request-history" element={<RequestHistory />} />
          
          {/* Short URL Redirect Handler */}
          <Route path="/q/:shortCode" element={<ShortUrlRedirect />} />
          
          <Route path="/front-desk" element={
            <TenantAwareLayout requiredRole="FRONT_DESK">
              <FrontDeskDashboard />
            </TenantAwareLayout>
          } />
          <Route path="/shift-terminal" element={
            <TenantAwareLayout allowedRoles={["FRONT_DESK", "MANAGER", "OWNER"]}>
              <ShiftTerminal />
            </TenantAwareLayout>
          } />
          <Route path="/shift-integration-status" element={
            <TenantAwareLayout allowedRoles={["FRONT_DESK", "MANAGER", "OWNER"]}>
              <div className="min-h-screen bg-background p-6">
                <div className="max-w-4xl mx-auto">
                  <ShiftIntegrationDashboard />
                </div>
              </div>
            </TenantAwareLayout>
          } />
          <Route path="/reports" element={<ReportsInterface />} />
          <Route path="/sms-templates" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER']}>
              <SMSTemplates />
            </TenantAwareLayout>
          } />
          <Route path="/qr-system-guide" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'FRONT_DESK']}>
              <QRSystemGuidePage />
            </TenantAwareLayout>
          } />
          <Route path="/qr-system-test" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER']}>
              <QRSystemTestPage />
            </TenantAwareLayout>
          } />
          
          {/* UNIFIED STAFF DASHBOARD - ALL ROLES */}
          <Route path="/dashboard/*" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'HOUSEKEEPING', 'MAINTENANCE', 'POS', 'FRONT_DESK']}>
              <DynamicDashboardShell useJsonConfig={true} />
            </TenantAwareLayout>
          } />
          
          {/* Wallet Management Route - Accessible to all staff roles */}
          <Route path="/dashboard/wallet-management" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'FRONT_DESK']}>
              <WalletManagementDashboard />
            </TenantAwareLayout>
          } />
          
          {/* Staff-specific routes */}
          <Route path="/staff-dashboard/qr-requests" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS']}>
              <QRRequests />
            </TenantAwareLayout>
          } />
          <Route path="/staff-dashboard/payment-verification" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'FRONT_DESK']}>
              <PaymentVerification />
            </TenantAwareLayout>
          } />
          
          {/* Legacy Routes - Redirect to Unified Dashboard */}
          <Route path="/owner-dashboard/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/manager-dashboard/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/accountant-dashboard/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/housekeeping-dashboard/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/maintenance-dashboard/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/pos/*" element={<Navigate to="/dashboard" replace />} />
          
          {/* Legacy Staff Dashboard Route */}
          <Route path="/staff-dashboard" element={
            <Navigate to="/dashboard" replace />
          } />
          
          {/* Debug Tools */}
          <Route path="/debug/menu-preview" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'SUPER_ADMIN']}>
              <MenuPreview />
            </TenantAwareLayout>
          } />
          <Route path="/debug/qr-system" element={
            <TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'SUPER_ADMIN']}>
              <QRDebugPanel />
            </TenantAwareLayout>
          } />
          
          {/* QR Export - Public route */}
          <Route path="/qr-export" element={<QRExportPage />} />
          
          {/* Hotel Dashboard Routes */}
          <Route path="/hotel/:tenantId/dashboard" element={<HotelDashboard />} />
          
          {/* Support Admin Routes */}
          <Route path="/support-admin" element={
            <TenantAwareLayout allowedRoles={['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PLATFORM_ADMIN', 'Support Admin', 'Platform Admin']}>
              <SupportAdminLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<SupportAdminDashboard />} />
            <Route path="dashboard" element={<SupportAdminDashboard />} />
            <Route path="tenants" element={<div>Tenants Management</div>} />
            <Route path="tickets" element={<div>Support Tickets</div>} />
            <Route path="impersonation" element={<div>Impersonation</div>} />
            <Route path="billing" element={<div>Plans & Billing</div>} />
            <Route path="addons" element={<div>Add-ons Catalog</div>} />
            <Route path="reports" element={<div>Reports</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>

          {/* Support Staff Routes */}
          <Route path="/support-staff" element={
            <TenantAwareLayout allowedRoles={['SUPER_ADMIN', 'SUPPORT_STAFF', 'SUPPORT_ADMIN', 'PLATFORM_ADMIN', 'Support Staff', 'Support Admin', 'Platform Admin']}>
              <SupportStaffLayout />
            </TenantAwareLayout>
          }>
            <Route index element={<Navigate to="/support-staff/dashboard" replace />} />
            <Route path="dashboard" element={<SupportStaffDashboard />} />
            <Route path="tenants" element={<div>Tenants Overview (Read-Only)</div>} />
            <Route path="tickets" element={<div>Support Tickets (Read-Only)</div>} />
            <Route path="reports" element={<div>Reports (Read-Only)</div>} />
          </Route>
          
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
            <Route path="addon-catalog" element={<AddonCatalog />} />
            <Route path="sms-management" element={<SMSManagement />} />
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
            <Route path="feature-flags" element={<FeatureFlagsPage />} />
            <Route path="staging-verification" element={<StagingVerification />} />
            <Route path="emergency-recovery" element={<EmergencyRecoveryPage />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SecurityDebugPanel />
        </BrowserRouter>
      </AppProviders>
    </MultiTenantAuthProvider>
  </QueryClientProvider>
);

export default App;
