import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Index from "@/pages/Index";
import QRMenu from "@/components/QRMenu";
import FrontDeskDashboard from "@/components/FrontDeskDashboard";
import OwnerDashboard from "@/components/OwnerDashboard";
import ReportsInterface from "@/components/ReportsInterface";
import QRExportPage from "@/components/QRExportPage";
import NotFound from "@/pages/NotFound";

// Empty page scaffolds
const Dashboard = () => <div className="p-6"><h1 className="text-2xl font-playfair font-bold">Dashboard</h1></div>;
const Reservations = () => <div className="p-6"><h1 className="text-2xl font-playfair font-bold">Reservations</h1></div>;
const RoomService = () => <div className="p-6"><h1 className="text-2xl font-playfair font-bold">Room Service Management</h1></div>;
const Settings = () => <div className="p-6"><h1 className="text-2xl font-playfair font-bold">Settings</h1></div>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Routes>
            {/* Marketing Home */}
            <Route path="/" element={<Index />} />
            
            {/* App Routes with Layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/front-desk" element={<FrontDeskDashboard />} />
              <Route path="/room-service" element={<RoomService />} />
              <Route path="/qr-export" element={<QRExportPage />} />
              <Route path="/reports" element={<ReportsInterface />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            </Route>
            
            {/* Public Routes (no layout) */}
            <Route path="/public/:hotelSlug/menu" element={<QRMenu />} />
            <Route path="/qr-menu" element={<QRMenu />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;