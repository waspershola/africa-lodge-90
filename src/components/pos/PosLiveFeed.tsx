import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Eye,
  CreditCard,
  Smartphone,
  Phone,
  Users
} from 'lucide-react';
import { usePOSApi, type Order } from '@/hooks/usePOSApi';
import { useToast } from '@/hooks/use-toast';
import OrderModal from './OrderModal';
import PaymentDrawer from './PaymentDrawer';
import { useAuth } from '@/hooks/useMultiTenantAuth';
import RoleGuard, { ProtectedButton } from './RoleGuard';

export default function PosLiveFeed() {
  const { orders, stats, isLoading, acceptOrder, updateOrderStatus } = usePOSApi();
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getFilteredOrders = (status: string) => {
    let filtered = orders;
    
    if (status !== 'all') {
      filtered = orders.filter(order => order.status === status);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.guest_name && order.guest_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.room_id && order.room_id.includes(searchTerm))
      );
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'accepted': return 'blue';
      case 'preparing': return 'orange';
      case 'ready': return 'green';
      case 'out_for_delivery': return 'purple';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'qr': return <Smartphone className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'walkin': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'charged': return 'blue';
      case 'unpaid': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!hasPermission('pos:accept_orders')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to accept orders.",
        variant: "destructive",
      });
      return;
    }
    await acceptOrder(orderId, user?.name || 'Current Staff');
  };

  const priorityOrders = orders.filter(order => 
    order.status === 'pending' && 
    (order.source === 'qr' || (Date.now() - new Date(order.created_at).getTime()) > 10 * 60 * 1000)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Restaurant POS - Live Orders</h1>
          <p className="text-muted-foreground mt-1">
            Real-time order management and kitchen coordination
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Priority Alerts */}
      {priorityOrders.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Priority Orders - Immediate Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityOrders.slice(0, 3).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-l-red-500">
                <div className="flex items-center gap-3">
                  {getSourceIcon(order.source)}
                  <div>
                    <p className="font-medium text-red-700">{order.order_number}</p>
                    <p className="text-sm text-red-600">
                      {order.room_id ? `Room ${order.room_id}` : order.guest_name} • 
                      {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)} min ago
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleAcceptOrder(order.id)}>
                  Accept Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orders Today</p>
                <p className="text-2xl font-bold">{stats.ordersToday}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg: ₦{(stats.averageOrderValue / 100).toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Kitchen</p>
                <p className="text-2xl font-bold text-orange-600">{stats.preparingOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Today</p>
                <p className="text-2xl font-bold text-green-600">₦{(stats.revenue / 100).toFixed(0)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders by number, guest name, or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pending">Pending ({stats.pendingOrders})</TabsTrigger>
          <TabsTrigger value="preparing">Kitchen ({stats.preparingOrders})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({stats.readyOrders})</TabsTrigger>
          <TabsTrigger value="out_for_delivery">Out ({orders.filter(o => o.status === 'out_for_delivery').length})</TabsTrigger>
          <TabsTrigger value="delivered">Complete</TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
        </TabsList>

        {['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'all'].map(tabStatus => (
          <TabsContent key={tabStatus} value={tabStatus} className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="grid gap-4">
                {getFilteredOrders(tabStatus).map(order => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSourceIcon(order.source)}
                            <Badge variant={getStatusColor(order.status) as any}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getPaymentStatusColor(order.payment_status) as any}>
                              {order.payment_status}
                            </Badge>
                            <span className="font-medium text-sm">{order.order_number}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h3 className="font-bold text-lg mb-1">
                                {order.room_id ? `Room ${order.room_id}` : 'Walk-in'}
                              </h3>
                              {order.guest_name && (
                                <p className="text-sm text-muted-foreground">{order.guest_name}</p>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-right">
                                ₦{(order.total_amount / 100).toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground text-right">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {order.items.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item.qty}x {item.menu_item.name}
                              </Badge>
                            ))}
                            {order.items.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{order.items.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                            {order.eta_minutes && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                ETA: {order.eta_minutes} min
                              </div>
                            )}
                            {order.assigned_staff && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {order.assigned_staff}
                              </div>
                            )}
                          </div>

                          {order.notes && (
                            <p className="text-sm bg-yellow-50 p-2 rounded mt-2 border-l-4 border-yellow-400">
                              <strong>Notes:</strong> {order.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={isLoading}
                            >
                              Accept Order
                            </Button>
                          )}
                          
                          {order.status === 'ready' && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                              disabled={isLoading}
                            >
                              Start Delivery
                            </Button>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              disabled={isLoading}
                            >
                              Mark Delivered
                            </Button>
                          )}

                          {order.status === 'delivered' && order.payment_status === 'unpaid' && (
                            <PaymentDrawer
                              order={order}
                              trigger={
                                <Button size="sm" variant="default">
                                  Process Payment
                                </Button>
                              }
                            />
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <OrderModal 
                                  order={selectedOrder} 
                                  onStatusUpdate={updateOrderStatus}
                                  isLoading={isLoading}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}