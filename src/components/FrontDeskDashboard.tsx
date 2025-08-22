import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar, 
  LogIn, 
  LogOut, 
  BedDouble,
  AlertCircle,
  CreditCard,
  WifiOff,
  Search,
  Plus,
  Clock,
  Wrench,
  Battery,
  DollarSign
} from "lucide-react";

// Mock data
const mockData = {
  roomsAvailable: 15,
  occupancyRate: 78,
  arrivalsToday: 12,
  departuresToday: 8,
  inHouseGuests: 45,
  pendingPayments: 3,
  oosRooms: 2,
  dieselLevel: 65,
  generatorRuntime: 4.5,
  cashVariance: -2500
};

const mockArrivals = [
  { id: 1, guest: "Adebayo Johnson", room: "201", time: "14:00", status: "pending" },
  { id: 2, guest: "Sarah Okonkwo", room: "305", time: "15:30", status: "checked-in" },
  { id: 3, guest: "Michael Eze", room: "102", time: "16:00", status: "pending" }
];

const mockDepartures = [
  { id: 1, guest: "Fatima Al-Hassan", room: "401", time: "11:00", status: "checked-out" },
  { id: 2, guest: "David Okoro", room: "203", time: "12:00", status: "pending" }
];

const mockAlerts = [
  { id: 1, type: "payment", message: "Room 305 payment overdue", priority: "high" },
  { id: 2, type: "maintenance", message: "Room 102 AC needs repair", priority: "medium" },
  { id: 3, type: "compliance", message: "Missing ID for Room 201", priority: "high" }
];

const FrontDeskDashboard = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [offlineTimeRemaining, setOfflineTimeRemaining] = useState(22); // hours
  const [searchQuery, setSearchQuery] = useState("");

  const dashboardCards = [
    {
      title: "Rooms Available",
      value: mockData.roomsAvailable,
      subtitle: "Ready for assignment",
      icon: <BedDouble className="h-6 w-6" />,
      action: "Assign Room",
      color: "success"
    },
    {
      title: "Occupancy Rate",
      value: `${mockData.occupancyRate}%`,
      subtitle: "Current occupancy",
      icon: <Users className="h-6 w-6" />,
      action: "View Room Map",
      color: "primary"
    },
    {
      title: "Arrivals Today",
      value: mockData.arrivalsToday,
      subtitle: "Expected check-ins",
      icon: <LogIn className="h-6 w-6" />,
      action: "Start Check-In",
      color: "accent"
    },
    {
      title: "Departures Today",
      value: mockData.departuresToday,
      subtitle: "Expected check-outs",
      icon: <LogOut className="h-6 w-6" />,
      action: "Start Check-Out",
      color: "warning"
    },
    {
      title: "In-House Guests",
      value: mockData.inHouseGuests,
      subtitle: "Currently staying",
      icon: <Users className="h-6 w-6" />,
      action: "Open Folio",
      color: "muted"
    },
    {
      title: "Pending Payments",
      value: mockData.pendingPayments,
      subtitle: "Requires collection",
      icon: <CreditCard className="h-6 w-6" />,
      action: "Collect Now",
      color: "danger"
    },
    {
      title: "OOS Rooms",
      value: mockData.oosRooms,
      subtitle: "Out of service",
      icon: <Wrench className="h-6 w-6" />,
      action: "Create Work Order",
      color: "warning"
    },
    {
      title: "Diesel Level",
      value: `${mockData.dieselLevel}%`,
      subtitle: `Gen: ${mockData.generatorRuntime}h today`,
      icon: <Battery className="h-6 w-6" />,
      action: "Open Power Panel",
      color: mockData.dieselLevel < 30 ? "danger" : "success"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      {isOffline && (
        <div className="offline-banner p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">
              Offline Mode Active - {offlineTimeRemaining}h remaining
            </span>
          </div>
          <p className="text-sm mt-1">
            All actions are queued and will sync when connection is restored
          </p>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-gradient">
                Front Desk Dashboard
              </h1>
              <p className="text-muted-foreground">
                Lagos Grand Hotel • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search guests, rooms, folios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => setIsOffline(!isOffline)}
              >
                {isOffline ? 'Go Online' : 'Simulate Offline'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <Card key={index} className="luxury-card group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    card.color === 'success' ? 'bg-success/10 text-success' :
                    card.color === 'primary' ? 'bg-primary/10 text-primary' :
                    card.color === 'accent' ? 'bg-accent/10 text-accent-foreground' :
                    card.color === 'warning' ? 'bg-warning/10 text-warning-foreground' :
                    card.color === 'danger' ? 'bg-danger/10 text-danger' :
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    {card.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{card.value}</div>
                    <div className="text-sm text-muted-foreground">{card.subtitle}</div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  {card.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Arrivals */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-success" />
                Today's Arrivals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockArrivals.map(arrival => (
                  <div key={arrival.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{arrival.guest}</div>
                      <div className="text-sm text-muted-foreground">
                        Room {arrival.room} • {arrival.time}
                      </div>
                    </div>
                    <Badge 
                      variant={arrival.status === 'checked-in' ? 'default' : 'secondary'}
                      className={arrival.status === 'checked-in' ? 'bg-success text-success-foreground' : ''}
                    >
                      {arrival.status === 'checked-in' ? 'Checked In' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Departures */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-warning" />
                Today's Departures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDepartures.map(departure => (
                  <div key={departure.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{departure.guest}</div>
                      <div className="text-sm text-muted-foreground">
                        Room {departure.room} • {departure.time}
                      </div>
                    </div>
                    <Badge 
                      variant={departure.status === 'checked-out' ? 'default' : 'secondary'}
                      className={departure.status === 'checked-out' ? 'bg-success text-success-foreground' : ''}
                    >
                      {departure.status === 'checked-out' ? 'Checked Out' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Process All Check-Outs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-danger" />
                Alerts & Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      alert.priority === 'high' ? 'bg-danger' : 'bg-warning'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {alert.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="luxury-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                    <LogIn className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">Sarah Okonkwo checked in</div>
                    <div className="text-sm text-muted-foreground">Room 305 • 2 minutes ago</div>
                  </div>
                </div>
                <Badge variant="secondary">Check-In</Badge>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Payment received - ₦15,000</div>
                    <div className="text-sm text-muted-foreground">Room 201 folio • 5 minutes ago</div>
                  </div>
                </div>
                <Badge variant="secondary">Payment</Badge>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-warning-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Fatima Al-Hassan checked out</div>
                    <div className="text-sm text-muted-foreground">Room 401 • 15 minutes ago</div>
                  </div>
                </div>
                <Badge variant="secondary">Check-Out</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 justify-center">
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Collect Payment
          </Button>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Quick Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FrontDeskDashboard;