import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Filter,
  FileText,
  Printer
} from "lucide-react";
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';

// Mock report data
const mockRevenueData = [
  { period: "Jan 2024", cash: 450000, pos: 800000, transfer: 650000, online: 300000 },
  { period: "Feb 2024", cash: 520000, pos: 920000, transfer: 780000, online: 350000 },
  { period: "Mar 2024", cash: 480000, pos: 1100000, transfer: 850000, online: 420000 },
  { period: "Apr 2024", cash: 610000, pos: 1200000, transfer: 900000, online: 480000 }
];

const mockOccupancyData = [
  { date: "2024-04-01", occupied: 45, available: 60, rate: 75 },
  { date: "2024-04-02", occupied: 52, available: 60, rate: 87 },
  { date: "2024-04-03", occupied: 48, available: 60, rate: 80 },
  { date: "2024-04-04", occupied: 55, available: 60, rate: 92 },
  { date: "2024-04-05", occupied: 58, available: 60, rate: 97 }
];

const mockRoomServiceData = [
  { category: "Main Course", orders: 89, revenue: 890000 },
  { category: "Beverages", orders: 156, revenue: 468000 },
  { category: "Appetizers", orders: 67, revenue: 335000 },
  { category: "Desserts", orders: 43, revenue: 215000 },
  { category: "Traditional", orders: 71, revenue: 710000 }
];

const mockHousekeepingData = [
  { room: "101", status: "Clean", turnaround: "25 min", staff: "Amaka O." },
  { room: "102", status: "In Progress", turnaround: "15 min", staff: "Kemi A." },
  { room: "201", status: "Clean", turnaround: "30 min", staff: "Folake S." },
  { room: "305", status: "Dirty", turnaround: "Pending", staff: "Unassigned" }
];

const ReportsInterface = () => {
  const [selectedReport, setSelectedReport] = useState("revenue");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [exportFormat, setExportFormat] = useState("excel");
  const { enabledMethods } = usePaymentMethodsContext();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalRevenue = (data: typeof mockRevenueData[0]) => {
    return data.cash + data.pos + data.transfer + data.online;
  };

  const reportTypes = [
    { id: "revenue", name: "Revenue by Payment Type", icon: <DollarSign className="h-4 w-4" /> },
    { id: "occupancy", name: "Occupancy Rate", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "room-service", name: "Room Service Orders", icon: <Users className="h-4 w-4" /> },
    { id: "housekeeping", name: "Housekeeping Status", icon: <FileText className="h-4 w-4" /> }
  ];

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
              Comprehensive insights into your hotel operations
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
                <SelectItem value="year-to-date">Year to Date</SelectItem>
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
      {selectedReport === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {enabledMethods.slice(0, 4).map((method, index) => {
              const colors = ["success", "primary", "accent", "warning"];
              const totals = mockRevenueData.reduce((acc, curr) => {
                const key = method.type as keyof typeof curr;
                return acc + (typeof curr[key] === 'number' ? curr[key] : 0);
              }, 0);
              
              return (
                <Card key={method.id} className="luxury-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        colors[index] === 'success' ? 'bg-success/10 text-success' :
                        colors[index] === 'primary' ? 'bg-primary/10 text-primary' :
                        colors[index] === 'accent' ? 'bg-accent/10 text-accent-foreground' :
                        'bg-warning/10 text-warning-foreground'
                      }`}>
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatCurrency(totals)}</div>
                    <div className="text-sm text-muted-foreground">{method.name}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue Trend by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Period</th>
                      {enabledMethods.slice(0, 4).map(method => (
                        <th key={method.id} className="text-right p-3 font-medium">{method.name}</th>
                      ))}
                      <th className="text-right p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRevenueData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{row.period}</td>
                        {enabledMethods.slice(0, 4).map(method => {
                          const key = method.type as keyof typeof row;
                          const value = typeof row[key] === 'number' ? row[key] : 0;
                          return (
                            <td key={method.id} className="p-3 text-right">{formatCurrency(value)}</td>
                          );
                        })}
                        <td className="p-3 text-right font-bold text-primary">
                          {formatCurrency(getTotalRevenue(row))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Occupancy Report */}
      {selectedReport === "occupancy" && (
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
                <div className="text-3xl font-bold mb-1">87%</div>
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
                <div className="text-3xl font-bold mb-1">52</div>
                <div className="text-sm text-muted-foreground">Rooms Occupied</div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <TrendingDown className="h-5 w-5 text-danger" />
                </div>
                <div className="text-3xl font-bold mb-1">8</div>
                <div className="text-sm text-muted-foreground">Rooms Available</div>
              </CardContent>
            </Card>
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Daily Occupancy Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {mockOccupancyData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">{row.occupied}</td>
                        <td className="p-3 text-right">{row.available}</td>
                        <td className="p-3 text-right font-bold">{row.rate}%</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant={row.rate >= 90 ? 'default' : row.rate >= 70 ? 'secondary' : 'outline'}
                            className={
                              row.rate >= 90 ? 'bg-success text-success-foreground' :
                              row.rate >= 70 ? 'bg-warning/20 text-warning-foreground' :
                              'bg-danger/20 text-danger'
                            }
                          >
                            {row.rate >= 90 ? 'High' : row.rate >= 70 ? 'Good' : 'Low'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Room Service Report */}
      {selectedReport === "room-service" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>Orders by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRoomServiceData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-muted-foreground">{item.orders} orders</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{formatCurrency(item.revenue)}</div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(item.revenue / item.orders)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Average Preparation Time</span>
                      <span className="text-sm text-muted-foreground">22 minutes</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '73%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">On-Time Delivery Rate</span>
                      <span className="text-sm text-muted-foreground">94%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <span className="text-sm text-muted-foreground">4.8/5.0</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: '96%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Housekeeping Report */}
      {selectedReport === "housekeeping" && (
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle>Housekeeping Status Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Room</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Turnaround Time</th>
                    <th className="text-left p-3 font-medium">Assigned Staff</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockHousekeepingData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Room {row.room}</td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant={
                            row.status === 'Clean' ? 'default' :
                            row.status === 'In Progress' ? 'secondary' :
                            'outline'
                          }
                          className={
                            row.status === 'Clean' ? 'bg-success text-success-foreground' :
                            row.status === 'In Progress' ? 'bg-warning/20 text-warning-foreground' :
                            'bg-danger/20 text-danger'
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{row.turnaround}</td>
                      <td className="p-3">{row.staff}</td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="outline">
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsInterface;
