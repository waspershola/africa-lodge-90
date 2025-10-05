import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
} from "lucide-react";
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { useRevenueAnalytics, useOccupancyAnalytics, useRoomServiceAnalytics, useHousekeepingAnalytics } from '@/hooks/data/useAnalyticsData';
import { LoadingState } from '@/components/common/LoadingState';
import { format } from 'date-fns';

const ReportsInterface = () => {
  const [selectedReport, setSelectedReport] = useState("revenue");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [exportFormat, setExportFormat] = useState("excel");
  const { enabledMethods } = usePaymentMethodsContext();

  const days = dateRange === 'last-7-days' ? 7 : dateRange === 'last-90-days' ? 90 : 30;
  
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(days);
  const { data: occupancyData, isLoading: occupancyLoading } = useOccupancyAnalytics(days);
  const { data: roomServiceData, isLoading: roomServiceLoading } = useRoomServiceAnalytics(days);
  const { data: housekeepingData, isLoading: housekeepingLoading } = useHousekeepingAnalytics(days);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const reportTypes = [
    { id: "revenue", name: "Revenue Analytics", icon: <DollarSign className="h-4 w-4" /> },
    { id: "occupancy", name: "Occupancy Rate", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "room-service", name: "Room Service Orders", icon: <Users className="h-4 w-4" /> },
    { id: "housekeeping", name: "Housekeeping Status", icon: <Calendar className="h-4 w-4" /> }
  ];

  if (revenueLoading && selectedReport === 'revenue') return <LoadingState message="Loading revenue data..." />;
  if (occupancyLoading && selectedReport === 'occupancy') return <LoadingState message="Loading occupancy data..." />;
  if (roomServiceLoading && selectedReport === 'room-service') return <LoadingState message="Loading room service data..." />;
  if (housekeepingLoading && selectedReport === 'housekeeping') return <LoadingState message="Loading housekeeping data..." />;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-gradient">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time insights into your hotel operations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            
            <Button className="bg-gradient-primary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {reportTypes.map(type => (
          <Button
            key={type.id}
            variant={selectedReport === type.id ? "default" : "outline"}
            onClick={() => setSelectedReport(type.id)}
            className="h-20 flex flex-col gap-2"
          >
            {type.icon}
            <span className="text-sm font-medium">{type.name}</span>
          </Button>
        ))}
      </div>

      {/* Revenue Report */}
      {selectedReport === "revenue" && revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(revenueData.totalRevenue)}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(revenueData.avgDailyRevenue)}</div>
                <div className="text-sm text-muted-foreground">Avg Daily Revenue</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(revenueData.adr)}</div>
                <div className="text-sm text-muted-foreground">ADR (Avg Daily Rate)</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(revenueData.revpar)}</div>
                <div className="text-sm text-muted-foreground">RevPAR</div>
              </CardContent>
            </Card>
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Daily Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.chartData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-right p-3 font-medium">Room Revenue</th>
                        <th className="text-right p-3 font-medium">Other Revenue</th>
                        <th className="text-right p-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.chartData.map((row: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.date}</td>
                          <td className="p-3 text-right">{formatCurrency(row.roomRevenue)}</td>
                          <td className="p-3 text-right">{formatCurrency(row.otherRevenue)}</td>
                          <td className="p-3 text-right font-bold text-primary">
                            {formatCurrency(row.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No revenue data available for this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Occupancy Report */}
      {selectedReport === "occupancy" && occupancyData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-3xl font-bold mb-1">{occupancyData.avgOccupancy}%</div>
                <div className="text-sm text-muted-foreground">Average Occupancy</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-3xl font-bold mb-1">{occupancyData.totalOccupiedRooms}</div>
                <div className="text-sm text-muted-foreground">Total Room Nights</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{occupancyData.chartData.length}</div>
                <div className="text-sm text-muted-foreground">Days Tracked</div>
              </CardContent>
            </Card>
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Daily Occupancy Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {occupancyData.chartData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-right p-3 font-medium">Occupied</th>
                        <th className="text-right p-3 font-medium">Available</th>
                        <th className="text-right p-3 font-medium">Occupancy Rate</th>
                        <th className="text-center p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancyData.chartData.map((row: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.date}</td>
                          <td className="p-3 text-right">{row.occupied}</td>
                          <td className="p-3 text-right">{row.available}</td>
                          <td className="p-3 text-right font-bold">{row.occupancy.toFixed(1)}%</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={row.occupancy >= 90 ? 'default' : row.occupancy >= 70 ? 'secondary' : 'outline'}
                              className={
                                row.occupancy >= 90 ? 'bg-success text-success-foreground' :
                                row.occupancy >= 70 ? 'bg-warning/20 text-warning-foreground' :
                                'bg-destructive/20 text-destructive'
                              }
                            >
                              {row.occupancy >= 90 ? 'High' : row.occupancy >= 70 ? 'Good' : 'Low'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No occupancy data available for this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Room Service Report */}
      {selectedReport === "room-service" && roomServiceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-3xl font-bold mb-1">{roomServiceData.totalOrders}</div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{roomServiceData.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{roomServiceData.chartData.length}</div>
                <div className="text-sm text-muted-foreground">Active Days</div>
              </CardContent>
            </Card>
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {roomServiceData.orders.length > 0 ? (
                <div className="space-y-3">
                  {roomServiceData.orders.slice(0, 10).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{order.service_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.rooms?.room_number || 'N/A'} • {format(new Date(order.created_at), 'PPp')}
                        </div>
                      </div>
                      <Badge variant={order.status === 'completed' ? 'default' : 'outline'}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No room service orders for this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Housekeeping Report */}
      {selectedReport === "housekeeping" && housekeepingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div className="text-3xl font-bold mb-1">{housekeepingData.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{housekeepingData.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{housekeepingData.avgDuration} min</div>
                <div className="text-sm text-muted-foreground">Avg Task Duration</div>
              </CardContent>
            </Card>
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Recent Housekeeping Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {housekeepingData.tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Room</th>
                        <th className="text-left p-3 font-medium">Task Type</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Duration</th>
                        <th className="text-left p-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {housekeepingData.tasks.slice(0, 15).map((task: any) => (
                        <tr key={task.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Room {task.rooms?.room_number || 'N/A'}</td>
                          <td className="p-3">{task.task_type}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={
                                task.status === 'completed' ? 'default' :
                                task.status === 'in_progress' ? 'secondary' :
                                'outline'
                              }
                            >
                              {task.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">{task.actual_minutes || '-'} min</td>
                          <td className="p-3">{format(new Date(task.created_at), 'PPp')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No housekeeping tasks for this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsInterface;
