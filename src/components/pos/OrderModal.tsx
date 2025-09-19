import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  CreditCard,
  FileText,
  Smartphone,
  Phone,
  Users,
  X
} from 'lucide-react';
import { type Order } from '@/hooks/usePOS';

interface OrderModalProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: Order['status']) => Promise<void>;
  isLoading: boolean;
}

export default function OrderModal({ order, onStatusUpdate, isLoading }: OrderModalProps) {
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'qr': return <Smartphone className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'walkin': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'qr': return 'QR Room Service';
      case 'phone': return 'Phone Order';
      case 'walkin': return 'Walk-in';
      default: return 'Unknown';
    }
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'charged': return 'blue';
      case 'unpaid': return 'destructive';
      default: return 'secondary';
    }
  };

  const canCancel = ['pending', 'accepted'].includes(order.status);
  const canMarkReady = order.status === 'preparing';
  const canStartDelivery = order.status === 'ready';
  const canMarkDelivered = order.status === 'ready';

  const handleStatusUpdate = async (status: Order['status']) => {
    await onStatusUpdate(order.id, status);
  };

  const handleCancel = async () => {
    if (cancellationReason.trim()) {
      await onStatusUpdate(order.id, 'cancelled');
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex items-start justify-between">
        <div>
        <div className="flex items-center gap-2 mb-2">
          {order.source && getSourceIcon(order.source)}
          <Badge variant={getStatusColor(order.status) as any}>
            {order.status.replace('_', ' ')}
          </Badge>
          {order.payment_status && (
            <Badge variant={getPaymentStatusColor(order.payment_status) as any}>
              {order.payment_status}
            </Badge>
          )}
        </div>
          <h2 className="text-2xl font-bold">{order.order_number}</h2>
          <p className="text-muted-foreground">{getSourceLabel(order.source)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">₦{(order.total_amount || 0).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Customer & Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer</p>
              <p className="font-medium">{order.guest_name || 'Walk-in Customer'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="font-medium">
                {order.room_id ? `Room ${order.room_id}` : 'Restaurant'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Order Time</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ETA</p>
              <p className="font-medium">
                {order.eta_minutes ? `${order.eta_minutes} minutes` : 'Not set'}
              </p>
            </div>
          </div>
          
          {order.assigned_staff && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Staff</p>
              <p className="font-medium">{order.assigned_staff}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.qty}x</span>
                    <h4 className="font-semibold">{item.menu_item.name}</h4>
                  </div>
                  {item.menu_item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.menu_item.description}
                    </p>
                  )}
                  {item.modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.modifiers.map((modifier, modIndex) => (
                        <Badge key={modIndex} variant="outline" className="text-xs">
                          {modifier.name} 
                          {modifier.price_delta !== 0 && (
                            <span className="ml-1">
                              ({modifier.price_delta > 0 ? '+' : ''}₦{(modifier.price_delta / 100).toFixed(2)})
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {item.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Prep time: {item.menu_item.prep_time_mins} min
                    {item.menu_item.stations.length > 0 && (
                      <>
                        <span>•</span>
                        Stations: {item.menu_item.stations.join(', ')}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₦{(item.subtotal / 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ₦{(item.menu_item.base_price / 100).toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold">₦{(order.total_amount / 100).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      {(order.notes || order.special_instructions) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {order.notes && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-3">
                <p className="text-sm"><strong>Order Notes:</strong> {order.notes}</p>
              </div>
            )}
            {order.special_instructions && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm"><strong>Special Instructions:</strong> {order.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {canMarkReady && (
              <Button onClick={() => handleStatusUpdate('ready')} disabled={isLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Ready
              </Button>
            )}
            
            {canStartDelivery && (
              <Button onClick={() => handleStatusUpdate('delivered')} disabled={isLoading}>
                <User className="h-4 w-4 mr-2" />
                Mark Delivered
              </Button>
            )}
            
            {canMarkDelivered && (
              <Button onClick={() => handleStatusUpdate('delivered')} disabled={isLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Delivered
              </Button>
            )}
          </div>

          {canCancel && (
            <div className="space-y-2">
              <Textarea
                placeholder="Reason for cancellation (required)"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
              />
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                disabled={isLoading || !cancellationReason.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Add internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <Button variant="outline" disabled={!notes.trim()}>
              <FileText className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
              <Badge variant={getPaymentStatusColor(order.payment_status) as any}>
                {order.payment_status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <p className="font-medium">
                {order.room_id ? 'Room Folio' : 'To be determined'}
              </p>
            </div>
          </div>
          
          {order.payment_status === 'unpaid' && (
            <div className="mt-4">
              <Button className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}