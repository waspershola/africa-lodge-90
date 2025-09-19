import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon,
  BarChart3, 
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Package,
  Download,
  RefreshCw
} from 'lucide-react';
import { usePOSApi } from '@/hooks/usePOSApi';
import { format } from 'date-fns';

export default function ReportsPage() {
  const { orders, menuItems, stats } = usePOSApi();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date()
  });

  // Calculate report data
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const completedOrders = todayOrders.filter(order => order.status === 'delivered');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const averageOrderTime = 25; // Mock calculation
  
  // Item popularity
  const itemSales = menuItems.map(item => {
    const soldCount = completedOrders.reduce((count, order) => {
      return count + order.items
        .filter(orderItem => orderItem.menu_item_id === item.id)
        .reduce((sum, orderItem) => sum + orderItem.qty, 0);
    }, 0);
    
    return {
      ...item,
      sold: soldCount,
      revenue: completedOrders.reduce((sum, order) => {
        return sum + order.items
          .filter(orderItem => orderItem.menu_item_id === item.id)
          .reduce((itemSum, orderItem) => itemSum + orderItem.subtotal, 0);
      }, 0)
    };
  }).sort((a, b) => b.sold - a.sold);

  // Hourly sales data (mock)
  const hourlySales = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    orders: Math.floor(Math.random() * 10),
    revenue: Math.floor(Math.random() * 50000)
  }));

  // Payment method breakdown
  const paymentBreakdown = {
    room_folio: completedOrders.filter(o => o.room_id).length,
    card: Math.floor(completedOrders.length * 0.4),
    cash: Math.floor(completedOrders.length * 0.2)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Reports</h1>
          <p className="text-muted-foreground mt-1">
            Sales analytics and performance insights
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange.from ? format(dateRange.from, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">₦{(totalRevenue / 100).toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orders Completed</p>
                <p className="text-2xl font-bold">{completedOrders.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {todayOrders.length} total orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₦{completedOrders.length ? (totalRevenue / completedOrders.length / 100).toFixed(0) : '0'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Prep Time</p>
                <p className="text-2xl font-bold">{averageOrderTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="items">Item Performance</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="shift">Shift Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Sales Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {hourlySales.map((hour) => (
                      <div key={hour.hour} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{hour.hour}:00</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{hour.orders} orders</span>
                          <span className="font-semibold">₦{(hour.revenue / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Room Charges</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{paymentBreakdown.room_folio}</p>
                      <p className="text-sm text-muted-foreground">
                        {((paymentBreakdown.room_folio / completedOrders.length) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Card Payments</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{paymentBreakdown.card}</p>
                      <p className="text-sm text-muted-foreground">
                        {((paymentBreakdown.card / completedOrders.length) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-amber-500 rounded"></div>
                      <span>Cash Payments</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{paymentBreakdown.cash}</p>
                      <p className="text-sm text-muted-foreground">
                        {((paymentBreakdown.cash / completedOrders.length) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {itemSales.slice(0, 20).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.sold} sold</p>
                        <p className="text-sm text-green-600">₦{(item.revenue / 100).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span>Completed Orders</span>
                    <Badge variant="default">{stats.completedOrders}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span>Pending Orders</span>
                    <Badge variant="secondary">{stats.pendingOrders}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span>In Kitchen</span>
                    <Badge variant="secondary">{stats.preparingOrders}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <span>Cancelled</span>
                    <Badge variant="destructive">{stats.cancelledOrders}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['qr', 'walkin', 'phone'].map(source => {
                    const count = todayOrders.filter(o => o.source === source).length;
                    const percentage = todayOrders.length ? (count / todayOrders.length * 100).toFixed(0) : 0;
                    
                    return (
                      <div key={source} className="flex items-center justify-between p-3 border rounded">
                        <span className="capitalize">{source === 'qr' ? 'QR Orders' : source === 'walkin' ? 'Walk-in' : 'Phone Orders'}</span>
                        <div className="text-right">
                          <p className="font-semibold">{count}</p>
                          <p className="text-sm text-muted-foreground">{percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shift" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shift Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Financial Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Gross Sales:</span>
                      <span className="font-semibold">₦{(totalRevenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Collected:</span>
                      <span className="font-semibold">₦{(totalRevenue * 0.075 / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Net Sales:</span>
                      <span className="font-bold text-lg">₦{(totalRevenue * 0.925 / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Operations Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Orders Served:</span>
                      <span className="font-semibold">{completedOrders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items Sold:</span>
                      <span className="font-semibold">
                        {completedOrders.reduce((sum, order) => sum + order.items.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Order Time:</span>
                      <span className="font-semibold">{averageOrderTime} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Shift Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}