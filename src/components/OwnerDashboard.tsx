import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Building,
  Bed,
  Clock,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRooms, useReservations } from "@/hooks/useRooms";
import { useStaff } from "@/hooks/useStaff";
import { useHotelPerformance } from "@/hooks/useHotelPerformance";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { reservations } = useReservations();
  const { rooms } = useRooms();
  const { staff } = useStaff();
  const { performance } = useHotelPerformance();

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(1) : '0';

  const thisMonthReservations = reservations.filter(r => {
    const created = new Date(r.created_at || '');
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const quickActions = [
    { title: "Reservations", path: "/owner-dashboard/reservations", icon: Calendar },
    { title: "Rooms", path: "/owner-dashboard/rooms", icon: Bed },
    { title: "Staff", path: "/owner-dashboard/staff", icon: Users },
    { title: "Reports", path: "/owner-dashboard/reports", icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Owner Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive overview of your hotel operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {occupiedRooms} of {totalRooms} rooms occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Reservations</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{thisMonthReservations.length}</div>
            <p className="text-xs text-muted-foreground">This month's bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{staff.length}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">₦{performance?.totalRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Month to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access key management areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center justify-center h-20 space-y-2"
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reservations</CardTitle>
            <CardDescription>Latest bookings and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {reservations.slice(0, 5).map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{reservation.guest_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(reservation.check_in_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm text-primary">₦{reservation.total_amount?.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Highlights</CardTitle>
            <CardDescription>Key metrics and trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Daily Rate</span>
              <span className="font-medium">₦{performance?.averageDailyRate?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue Per Room</span>
              <span className="font-medium">₦{performance?.revenuePerRoom?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Satisfaction Score</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">4.8/5</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;