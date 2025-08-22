import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Breadcrumbs } from "./Breadcrumbs";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/api/mockAdapter";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const user = getCurrentUser();

  // Don't show layout for marketing pages
  const isMarketingPage = location.pathname === "/" || location.pathname.startsWith("/public/");
  
  if (isMarketingPage) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: sidebarOpen ? 280 : 80,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative"
        >
          <Sidebar 
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <TopBar 
            user={user}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <main className="p-6">
            <Breadcrumbs />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      <Toaster />
    </div>
  );
}