import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Settings, 
  Eye, 
  Download, 
  RefreshCw,
  XCircle,
  DollarSign,
  Clock,
  Shield,
  Activity,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  Printer,
  Users,
  Coffee,
  Utensils,
  Bed,
  Car,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

// Import our functional dialogs
import { QRCodeGenerationDialog } from '@/components/manager/qr/QRCodeGenerationDialog';
import { QRCodePreviewDialog } from '@/components/manager/qr/QRCodePreviewDialog';
import { ServiceConfigDialog } from '@/components/manager/qr/ServiceConfigDialog';
import { FraudAlertDialog } from '@/components/manager/qr/FraudAlertDialog';
import { EnhancedPricingControl } from '@/components/manager/pricing/EnhancedPricingControl';
import type { ServicePricing, PricingChange } from '@/types/pricing';

const QRManagement = () => {
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceSettings, setServiceSettings] = useState([
    {
      service: 'Room Service',
      icon: Utensils,
      enabled: true,
      pricing: 'Dynamic',
      availability: '24/7',
      surcharge: 'Late night +20%'
    },
    {
      service: 'Housekeeping',
      icon: Bed,
      enabled: true,
      pricing: 'Free',
      availability: '8AM - 6PM',
      surcharge: 'None'
    },
    {
      service: 'Concierge',
      icon: Users,
      enabled: true,
      pricing: 'Free',
      availability: '24/7',
      surcharge: 'None'
    },
    {
      service: 'Transport',
      icon: Car,
      enabled: true,
      pricing: 'Fixed Rate',
      availability: '6AM - 11PM',
      surcharge: 'Airport +50%'
    },
    {
      service: 'Spa',
      icon: Coffee,
      enabled: false,
      pricing: 'Premium',
      availability: '10AM - 8PM',
      surcharge: 'Weekend +15%'
    }
  ]);
  const { toast } = useToast();

  const roomQRCodes = [
    {
      room: '101',
      floor: '1st Floor',
      status: 'active',
      generated: '2024-01-10',
      scans: 45,
      lastScan: '2 hours ago',
      services: ['Room Service', 'Housekeeping', 'Concierge'],
      pricing: 'Standard',
      revenue: 12500,
      issues: 0
    },
    {
      room: '102',
      floor: '1st Floor', 
      status: 'active',
      generated: '2024-01-10',
      scans: 23,
      lastScan: '5 hours ago',
      services: ['Room Service', 'Housekeeping'],
      pricing: 'Standard',
      revenue: 8900,
      issues: 0
    },
    {
      room: '201',
      floor: '2nd Floor',
      status: 'maintenance',
      generated: '2024-01-10',
      scans: 0,
      lastScan: 'Never',
      services: [],
      pricing: 'Disabled',
      revenue: 0,
      issues: 1
    },
    {
      room: '301',
      floor: '3rd Floor',
      status: 'active',
      generated: '2024-01-08',
      scans: 156,
      lastScan: '15 mins ago',
      services: ['Room Service', 'Housekeeping', 'Concierge', 'Spa', 'Transport'],
      pricing: 'VIP',
      revenue: 45000,
      issues: 0
    }
  ];

  const qrRequests = [
    {
      id: 'QR-2024-001',
      room: '301',
      guest: 'VIP Guest',
      service: 'Room Service',
      request: 'Dinner for 2 - Premium Menu',
      amount: 8500,
      timestamp: '2024-01-15 19:45:00',
      status: 'in-progress',
      assignedTo: 'Restaurant Team',
      slaStatus: 'on-time'
    },
    {
      id: 'QR-2024-002',
      room: '102',
      guest: 'John Smith',
      service: 'Housekeeping',
      request: 'Extra towels and pillows',
      amount: 0,
      timestamp: '2024-01-15 18:20:00',
      status: 'completed',
      assignedTo: 'Housekeeping Team',
      slaStatus: 'completed'
    },
    {
      id: 'QR-2024-003',
      room: '205',
      guest: 'Maria Garcia',
      service: 'Maintenance',
      request: 'AC temperature control issue',
      amount: 0,
      timestamp: '2024-01-15 16:30:00',
      status: 'overdue',
      assignedTo: 'Maintenance Team',
      slaStatus: 'overdue'
    }
  ];

  const auditLogs = [
    {
      id: 1,
      action: 'QR Code Generated',
      room: 'Rooms 201-210',
      user: 'Manager',
      timestamp: '2024-01-15 14:30:00',
      details: 'Batch generation for 2nd floor renovation completion'
    },
    {
      id: 2,
      action: 'Service Pricing Updated',
      room: 'Room 301',
      user: 'Manager',
      timestamp: '2024-01-15 13:15:00',
      details: 'Enabled VIP pricing tier for Presidential Suite'
    },
    {
      id: 3,
      action: 'QR Code Deactivated',
      room: 'Room 156',
      user: 'Manager',
      timestamp: '2024-01-15 11:45:00',
      details: 'Temporary deactivation for deep cleaning'
    }
  ];

  const qrStats = {
    totalCodes: 52,
    activeCodes: 48,
    todayScans: 234,
    todayRevenue: 89500,
    avgResponseTime: '12 mins',
    issueCount: 3
  };

  // Mock data for enhanced pricing control
  const mockServicePricing: ServicePricing[] = [
    {
      id: 'rs-1',
      serviceType: 'room-service',
      itemName: 'Club Sandwich',
      basePrice: 4000,
      currentPrice: 4500,
      currency: 'NGN',
      pricingModel: 'dynamic',
      surchargeRules: [
        {
          type: 'time-based',
          name: 'Night Premium',
          percentage: 20,
          active: true,
          conditions: {
            timeRange: { start: '22:00', end: '06:00' }
          }
        }
      ],
      availability: {
        enabled: true,
        timeRestrictions: {
          enabled: false,
          startTime: '00:00',
          endTime: '23:59',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        seasonalAvailability: {
          enabled: false,
          seasons: []
        },
        roomTypeAvailability: ['standard', 'deluxe', 'suite'],
        maxRequestsPerDay: 0,
        advanceNoticeRequired: 0,
        staffApprovalRequired: false
      },
      roomTypeRestrictions: ['standard', 'deluxe', 'suite'],
      lastUpdated: '2024-01-15T10:30:00Z',
      updatedBy: 'Manager Ahmed',
      status: 'active'
    },
    {
      id: 'hk-1',
      serviceType: 'housekeeping',
      itemName: 'Extra Towels',
      basePrice: 0,
      currentPrice: 0,
      currency: 'NGN',
      pricingModel: 'free',
      surchargeRules: [],
      availability: {
        enabled: true,
        timeRestrictions: {
          enabled: true,
          startTime: '08:00',
          endTime: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        seasonalAvailability: {
          enabled: false,
          seasons: []
        },
        roomTypeAvailability: ['standard', 'deluxe', 'suite'],
        maxRequestsPerDay: 3,
        advanceNoticeRequired: 15,
        staffApprovalRequired: false
      },
      roomTypeRestrictions: [],
      lastUpdated: '2024-01-14T15:45:00Z',
      updatedBy: 'Manager Sarah',
      status: 'active'
    }
  ];

  const mockPendingChanges: PricingChange[] = [
    {
      id: 'PC-2024-001',
      serviceType: 'room-service',
      itemName: 'Premium Steak Dinner',
      currentPrice: 12000,
      proposedPrice: 14500,
      changePercentage: 20.83,
      changeAmount: 2500,
      reason: 'Increased cost of imported beef and seasonal demand surge',
      requestedBy: 'Manager Ahmed',
      requestedAt: '2024-01-15T14:20:00Z',
      status: 'pending',
      effectiveDate: '2024-01-16',
      hotelId: 'hotel-1',
      roomType: ['deluxe', 'suite']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'maintenance': return 'secondary';
      case 'disabled': return 'destructive';
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'overdue': return 'destructive';
      case 'on-time': return 'default';
      default: return 'default';
    }
  };

  const filteredRooms = roomQRCodes.filter(room => {
    const floorMatch = selectedFloor === 'all' || room.floor === selectedFloor;
    const searchMatch = searchTerm === '' || room.room.includes(searchTerm);
    return floorMatch && searchMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">QR Code Management Center</h1>
          <p className="text-muted-foreground">Operational QR control, pricing, monitoring, and service management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Live Monitor
          </Button>
          <Button>
            <QRCodeGenerationDialog 
              trigger={
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Batch QR
                </>
              }
            />
          </Button>
        </div>
      </motion.div>

      {/* QR Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{qrStats.totalCodes}</div>
              <div className="text-sm text-muted-foreground">Total QR Codes</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{qrStats.activeCodes}</div>
              <div className="text-sm text-muted-foreground">Active Codes</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{qrStats.todayScans}</div>
              <div className="text-sm text-muted-foreground">Today's Scans</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">₦{qrStats.todayRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">QR Revenue</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{qrStats.avgResponseTime}</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{qrStats.issueCount}</div>
              <div className="text-sm text-muted-foreground">Active Issues</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="codes">Room QR Codes</TabsTrigger>
          <TabsTrigger value="requests">Live Requests</TabsTrigger>
          <TabsTrigger value="services">Service Settings</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Control</TabsTrigger>
          <TabsTrigger value="audit">Audit & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-6">
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter & Batch Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                  <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Floors</SelectItem>
                      <SelectItem value="1st Floor">1st Floor</SelectItem>
                      <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                      <SelectItem value="3rd Floor">3rd Floor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Bulk Print
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Batch Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Room QR Codes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room.room}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold">Room {room.room}</h3>
                            <Badge variant={getStatusColor(room.status)}>
                              {room.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{room.floor}</p>
                        </div>
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <QrCode className="h-8 w-8" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Total Scans</div>
                            <div className="font-medium">{room.scans}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Last Scan</div>
                            <div className="font-medium">{room.lastScan}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Revenue</div>
                            <div className="font-medium text-green-600">₦{room.revenue.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <div className="text-sm font-medium mb-2">Available Services:</div>
                          <div className="flex flex-wrap gap-1">
                            {room.services.map((service, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Pricing & Issues */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-muted-foreground">Pricing Tier:</span>
                            <span className="ml-2 font-medium">{room.pricing}</span>
                          </div>
                          {room.issues > 0 && (
                            <Badge variant="destructive">
                              {room.issues} Issue{room.issues > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <QRCodePreviewDialog
                            trigger={
                              <Button size="sm" variant="outline" className="flex-1">
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            }
                            room={room.room}
                            services={room.services}
                            pricing={room.pricing}
                            scans={room.scans}
                            revenue={room.revenue}
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => toast({
                              title: `Room ${room.room} Configuration`,
                              description: "QR code settings updated successfully.",
                            })}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toast({
                              title: `Room ${room.room} QR Regenerated`,
                              description: "New QR code generated. Previous code deactivated.",
                            })}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {room.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toast({
                                title: `Room ${room.room} QR Deactivated`,
                                description: "QR code has been temporarily disabled.",
                                variant: "destructive"
                              })}
                            >
                              <XCircle className="h-4 w-4" />
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

        <TabsContent value="requests" className="space-y-6">
          {/* Live QR Requests */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Live QR Service Requests
                </CardTitle>
                <CardDescription>Real-time monitoring of guest-initiated QR requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qrRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{request.id}</span>
                          <Badge variant={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <Badge variant={getStatusColor(request.slaStatus)}>
                            {request.slaStatus}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>Room {request.room}:</strong> {request.guest}</div>
                          <div><strong>Service:</strong> {request.service}</div>
                          <div><strong>Request:</strong> {request.request}</div>
                          <div><strong>Assigned:</strong> {request.assignedTo}</div>
                          <div><strong>Time:</strong> {request.timestamp}</div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        {request.amount > 0 && (
                          <div className="text-lg font-bold text-green-600">
                            ₦{request.amount.toLocaleString()}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toast({
                              title: "Request Override",
                              description: `Manager override applied to request ${request.id}`,
                            })}
                          >
                            Override
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Service Configuration */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Service Access Control
                </CardTitle>
                <CardDescription>Configure which services are available through QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {serviceSettings.map((service, index) => (
                    <motion.div
                      key={service.service}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <service.icon className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{service.service}</h3>
                          <div className="text-sm text-muted-foreground">
                            {service.pricing} • {service.availability} • {service.surcharge}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={service.enabled} 
                          onCheckedChange={(checked) => {
                            setServiceSettings(prev => prev.map(s => 
                              s.service === service.service 
                                ? { ...s, enabled: checked }
                                : s
                            ));
                            toast({
                              title: `${service.service} ${checked ? 'Enabled' : 'Disabled'}`,
                              description: `Service availability updated across all QR codes.`,
                            });
                          }}
                        />
                        <ServiceConfigDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              Configure
                            </Button>
                          }
                          serviceName={service.service}
                          currentConfig={{
                            enabled: service.enabled,
                            pricing: service.pricing,
                            availability: service.availability,
                            surcharge: service.surcharge
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <EnhancedPricingControl
            services={mockServicePricing}
            pendingChanges={mockPendingChanges}
            onPriceChange={(change) => {
              toast({
                title: "Price Change Submitted",
                description: change.status === 'auto-approved' 
                  ? "Change applied immediately within delegation limits."
                  : "Change queued for owner approval.",
              });
            }}
            onSurchargeUpdate={(serviceId, rules) => {
              toast({
                title: "Surcharge Rules Updated",
                description: "Dynamic pricing rules have been applied.",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* QR Usage Analytics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  QR Usage Analytics
                </CardTitle>
                <CardDescription>Service usage stats and revenue attribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">60%</div>
                    <div className="text-sm text-muted-foreground">Room Service Usage</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₦245K</div>
                    <div className="text-sm text-muted-foreground">Weekly QR Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">8.5 mins</div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                </div>

                {/* Service Usage Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Room Service</span>
                    <span className="text-sm font-medium">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Housekeeping</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Concierge</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other Services</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audit Log */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  QR Management Audit Log
                </CardTitle>
                <CardDescription>Track all QR management actions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{log.action}</div>
                        <div className="text-sm text-muted-foreground">
                          <strong>{log.room}</strong> by {log.user} - {log.timestamp}
                        </div>
                        <div className="text-xs text-muted-foreground">{log.details}</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QRManagement;