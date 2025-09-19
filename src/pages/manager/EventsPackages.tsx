import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Coffee,
  Utensils,
  Music,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EventsPackages = () => {
  const upcomingEvents = [
    {
      id: 1,
      name: 'Corporate Training Seminar',
      type: 'Corporate',
      date: '2024-01-18',
      time: '09:00 - 17:00',
      attendees: 45,
      maxCapacity: 50,
      venue: 'Conference Hall A',
      revenue: 225000,
      status: 'confirmed',
      coordinator: 'Sarah Johnson',
      requirements: ['Projector', 'Wi-Fi', 'Catering', 'Parking']
    },
    {
      id: 2,
      name: 'Wedding Reception',
      type: 'Wedding',
      date: '2024-01-20',
      time: '18:00 - 23:00',
      attendees: 120,
      maxCapacity: 150,
      venue: 'Grand Ballroom',
      revenue: 850000,
      status: 'confirmed',
      coordinator: 'Mike Chen',
      requirements: ['Decoration', 'DJ', 'Photography', 'Catering', 'Bar Service']
    },
    {
      id: 3,
      name: 'Product Launch Event',
      type: 'Corporate',
      date: '2024-01-22',
      time: '14:00 - 18:00',
      attendees: 80,
      maxCapacity: 100,
      venue: 'Exhibition Hall',
      revenue: 320000,
      status: 'planning',
      coordinator: 'Emily Rodriguez',
      requirements: ['Stage Setup', 'Lighting', 'Catering', 'Security']
    }
  ];

  const occupancyImpact = [
    {
      date: '2024-01-18',
      event: 'Corporate Training',
      reservedRooms: 15,
      potentialRevenue: 67500,
      actualBookings: 12,
      impact: 'medium'
    },
    {
      date: '2024-01-20',
      event: 'Wedding Reception',
      reservedRooms: 25,
      potentialRevenue: 156250,
      actualBookings: 22,
      impact: 'high'
    },
    {
      date: '2024-01-22',
      event: 'Product Launch',
      reservedRooms: 20,
      potentialRevenue: 90000,
      actualBookings: 18,
      impact: 'medium'
    }
  ];

  const staffAssignments = [
    {
      event: 'Corporate Training Seminar',
      staff: [
        { name: 'Sarah Johnson', role: 'Event Coordinator', status: 'assigned' },
        { name: 'David Kim', role: 'F&B Manager', status: 'assigned' },
        { name: 'Lisa Chen', role: 'Tech Support', status: 'pending' },
        { name: 'James Wilson', role: 'Security', status: 'assigned' }
      ]
    },
    {
      event: 'Wedding Reception',
      staff: [
        { name: 'Mike Chen', role: 'Event Coordinator', status: 'assigned' },
        { name: 'Maria Garcia', role: 'Banquet Manager', status: 'assigned' },
        { name: 'Robert Taylor', role: 'Bar Manager', status: 'assigned' },
        { name: 'Anna Johnson', role: 'Decorator', status: 'confirmed' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'planning': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'assigned': return 'default';
      case 'pending': return 'secondary';
      default: return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Corporate': return <Coffee className="h-4 w-4" />;
      case 'Wedding': return <Camera className="h-4 w-4" />;
      case 'Conference': return <Users className="h-4 w-4" />;
      case 'Social': return <Music className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
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
          <h1 className="text-3xl font-bold text-foreground">Events & Package Monitoring</h1>
          <p className="text-muted-foreground">Event oversight, occupancy forecasts, and staff coordination</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Forecast Report
          </Button>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Event
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-muted-foreground">Upcoming Events</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">₦1.4M</div>
              <div className="text-sm text-muted-foreground">Total Event Revenue</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">52</div>
              <div className="text-sm text-muted-foreground">Reserved Rooms</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">245</div>
              <div className="text-sm text-muted-foreground">Total Attendees</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy Impact</TabsTrigger>
          <TabsTrigger value="staff">Staff Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Event Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          {/* Upcoming Events */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(event.type)}
                          <div>
                            <h3 className="font-medium">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">{event.type} Event</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span>{event.coordinator}</span>
                          </div>
                        </div>

                        {/* Attendees Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Attendance</span>
                            <span>{event.attendees} / {event.maxCapacity}</span>
                          </div>
                          <Progress value={(event.attendees / event.maxCapacity) * 100} className="h-2" />
                        </div>

                        {/* Revenue */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Event Revenue:</span>
                          <span className="font-medium text-green-600">₦{event.revenue.toLocaleString()}</span>
                        </div>

                        {/* Requirements */}
                        <div>
                          <div className="text-sm font-medium mb-2">Requirements:</div>
                          <div className="flex flex-wrap gap-1">
                            {event.requirements.map((req, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-6">
          {/* Occupancy Impact Forecast */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Event Occupancy Impact Forecast
                </CardTitle>
                <CardDescription>Room reservations and revenue projections for upcoming events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {occupancyImpact.map((impact, index) => (
                    <motion.div
                      key={impact.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{impact.event}</span>
                          <Badge variant={getImpactColor(impact.impact)}>
                            {impact.impact} impact
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Event Date: {impact.date}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Reserved Rooms</div>
                          <div className="text-lg font-bold">{impact.reservedRooms}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Actual Bookings</div>
                          <div className="text-lg font-bold text-green-600">{impact.actualBookings}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Potential Revenue</div>
                          <div className="text-lg font-bold text-blue-600">₦{impact.potentialRevenue.toLocaleString()}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">📊 Forecast Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                    <div>Total Reserved Rooms: <strong>60</strong></div>
                    <div>Confirmed Bookings: <strong>52</strong></div>
                    <div>Projected Revenue: <strong>₦313,750</strong></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {/* Staff Assignments */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="space-y-6">
              {staffAssignments.map((assignment, index) => (
                <Card key={assignment.event}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {assignment.event}
                    </CardTitle>
                    <CardDescription>Staff task assignments and coordination</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignment.staff.map((member, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.role}</div>
                          </div>
                          <Badge variant={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Assign More Staff
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Send Notifications
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Event Performance Analytics</CardTitle>
                <CardDescription>Event success metrics, revenue analysis, and booking trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Event Analytics Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Detailed event performance metrics, revenue analysis, and occupancy correlations.
                  </p>
                  <Button>
                    View Event Reports
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

export default EventsPackages;