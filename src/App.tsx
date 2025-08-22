import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import QRMenu from "./components/QRMenu";
import FrontDeskDashboard from "./components/FrontDeskDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import ReportsInterface from "./components/ReportsInterface";
import QRExportPage from "./components/QRExportPage";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";
import Dashboard from "./pages/sa/Dashboard";
import Tenants from "./pages/sa/Tenants";
import Templates from "./pages/sa/Templates";
import Roles from "./pages/sa/Roles";
import GlobalUsers from "./pages/sa/GlobalUsers";
import Support from "./pages/sa/Support";
import Wizard from "./pages/sa/Wizard";
import Plans from "./pages/sa/Plans";
import Policies from "./pages/sa/Policies";
import Advanced from "./pages/sa/Advanced";
import Audit from "./pages/sa/Audit";
import Metrics from "./pages/sa/Metrics";
import HotelDashboard from "./pages/hotel/Dashboard";
import FrontDeskPWA from "./pages/frontdesk/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/qr-menu" element={<QRMenu />} />
          <Route path="/front-desk" element={<FrontDeskPWA />} />
          <Route path="/old-front-desk" element={<FrontDeskDashboard />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          <Route path="/reports" element={<ReportsInterface />} />
          <Route path="/qr-export" element={<QRExportPage />} />
          
          {/* Hotel Dashboard Routes */}
          <Route path="/hotel/:tenantId/dashboard" element={<HotelDashboard />} />
          
          {/* Front Desk PWA Routes */}
          <Route path="/:hotelSlug/frontdesk" element={<FrontDeskPWA />} />
          
          {/* Super Admin Routes */}
          <Route path="/sa" element={<SuperAdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="templates" element={<Templates />} />
            <Route path="roles" element={<Roles />} />
            <Route path="global-users" element={<GlobalUsers />} />
            <Route path="support" element={<Support />} />
            <Route path="wizard" element={<Wizard />} />
            <Route path="plans" element={<Plans />} />
            <Route path="policies" element={<Policies />} />
            <Route path="advanced" element={<Advanced />} />
            <Route path="audit" element={<Audit />} />
            <Route path="metrics" element={<Metrics />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;