import { Routes, Route } from 'react-router-dom';
import OwnerDashboard from '@/components/OwnerDashboard';
import HotelConfigurationPage from '@/components/owner/HotelConfigurationPage';
import ReservationsPage from '@/pages/owner/Reservations';
import RoomInventoryGrid from '@/components/owner/rooms/RoomInventoryGrid';
import GuestDirectory from '@/components/owner/guests/GuestDirectory';
import { QRCodeManager } from '@/components/frontdesk/QRCodeManager';
import { StaffManagementDashboard } from '@/components/owner/staff/StaffManagementDashboard';
import { EnhancedBillingInterface } from '@/components/owner/EnhancedBillingInterface';
import UtilityCostTracking from '@/components/owner/utilities/UtilityCostTracking';
import { OwnerProfileSettings } from '@/components/owner/profile/OwnerProfileSettings';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export function OwnerDashboardRouter() {
  const { user, tenant } = useAuth();

  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access the owner dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<OwnerDashboard />} />
        <Route path="/configuration" element={<HotelConfigurationPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/rooms" element={<RoomInventoryGrid />} />
        <Route path="/guests" element={<GuestDirectory onGuestSelect={() => {}} onNewGuest={() => {}} />} />
        <Route path="/qr-manager" element={<QRCodeManager />} />
        <Route path="/staff" element={<StaffManagementDashboard />} />
        <Route path="/billing" element={<EnhancedBillingInterface />} />
        <Route path="/utilities" element={<UtilityCostTracking />} />
        <Route path="/profile" element={<OwnerProfileSettings />} />
      </Routes>
    </div>
  );
}