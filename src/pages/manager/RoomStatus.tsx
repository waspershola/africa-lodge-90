import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bed, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Users,
  Settings,
  Filter,
  Search,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RoomStatus = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const rooms = [
    {
      number: '101',
      type: 'Standard',
      status: 'occupied',
      guest: 'John Smith',
      checkIn: '2024-01-15',
      checkOut: '2024-01-17',
      housekeeping: 'clean',
      maintenance: 'none',
      lastCleaned: '2 hours ago',
      revenue: 15000
    },
    {
      number: '102',
      type: 'Deluxe',
      status: 'available',
      guest: null,
      checkIn: null,
      checkOut: null,
      housekeeping: 'ready',
      maintenance: 'none',
      lastCleaned: '30 mins ago',
      revenue: 0
    },
    {
      number: '103',
      type: 'Suite',
      status: 'checkout',
      guest: 'Maria Garcia',
      checkIn: '2024-01-14',
      checkOut: 'Today',
      housekeeping: 'dirty',
      maintenance: 'none',
      lastCleaned: '1 day ago',
      revenue: 35000
    },
    {
      number: '201',
      type: 'Standard',
      status: 'maintenance',
      guest: null,
      checkIn: null,
      checkOut: null,
      housekeeping: 'ooo',
      maintenance: 'AC repair',
      lastCleaned: '3 days ago',
      revenue: 0
    },
    {
      number: '202',
      type: 'Deluxe',
      status: 'checkin',
      guest: 'David Wilson',
      checkIn: 'Today',
      checkOut: '2024-01-18',
      housekeeping: 'clean',
      maintenance: 'none',
      lastCleaned: '1 hour ago',
      revenue: 22000
    },
    {
      number: '301',
      type: 'Presidential Suite',
      status: 'occupied',
      guest: 'VIP Guest',
      checkIn: '2024-01-13',
      checkOut: '2024-01-20',
      housekeeping: 'clean',
      maintenance: 'none',
      lastCleaned: '1 hour ago',
      revenue: 85000
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'default';
      case 'available': return 'secondary';
      case 'checkout': return 'default';
      case 'checkin': return 'default';
      case 'maintenance': return 'destructive';
      case 'ooo': return 'destructive';
      default: return 'default';
    }
  };

  const getHousekeepingColor = (status: string) => {
    switch (status) {
      case 'clean': return 'default';
      case 'dirty': return 'destructive';
      case 'ready': return 'default';
      case 'ooo': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const statusMatch = filterStatus === 'all' || room.status === filterStatus;
    const searchMatch = searchTerm === '' || 
      room.number.includes(searchTerm) || 
      room.guest?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const roomStats = {
    total: rooms.length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    available: rooms.filter(r => r.status === 'available').length,
    maintenance: rooms.filter(r => r.status === 'maintenance' || r.maintenance !== 'none').length,
    dirty: rooms.filter(r => r.housekeeping === 'dirty').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Status Board</h1>
          <p className="text-muted-foreground">Real-time room management and housekeeping oversight</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh: ON
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Room Settings
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{roomStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Rooms</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{roomStats.occupied}</div>
              <div className="text-sm text-muted-foreground">Occupied</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{roomStats.available}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{roomStats.maintenance}</div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{roomStats.dirty}</div>
              <div className="text-sm text-muted-foreground">Need Cleaning</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="grid">Room Grid</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="checkout">Check-out</SelectItem>
                <SelectItem value="checkin">Check-in</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="grid" className="space-y-6">
          {/* Room Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room.number}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Room {room.number}</h3>
                        <Badge variant={getStatusColor(room.status)}>
                          {room.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{room.type}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {room.guest && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{room.guest}</span>
                          </div>
                        )}
                        
                        {room.checkIn && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {room.checkIn} → {room.checkOut}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Housekeeping:</span>
                          <Badge variant={getHousekeepingColor(room.housekeeping)}>
                            {room.housekeeping}
                          </Badge>
                        </div>

                        {room.maintenance !== 'none' && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{room.maintenance}</span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Last cleaned: {room.lastCleaned}
                        </div>

                        {room.revenue > 0 && (
                          <div className="text-sm font-medium text-green-600">
                            Revenue: ₦{room.revenue.toLocaleString()}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Details
                          </Button>
                          {room.guest && (
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Room List View</CardTitle>
                <CardDescription>Detailed room information in list format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">List View Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed list view with sortable columns will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="housekeeping" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Housekeeping Management</CardTitle>
                <CardDescription>Assign and track housekeeping tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Housekeeping Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Task assignment and housekeeping staff management will be available here.
                  </p>
                  <Button>
                    Assign Cleaning Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomStatus;