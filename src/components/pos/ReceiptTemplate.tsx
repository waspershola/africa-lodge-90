import { forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type Order } from '@/hooks/usePOSApi';

interface ReceiptTemplateProps {
  order: Order;
  variant?: 'a4' | 'thermal';
  hotelInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    taxId?: string;
  };
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ order, variant = 'a4', hotelInfo }, ref) => {
    const isA4 = variant === 'a4';
    
    const defaultHotelInfo = {
      name: 'Lagos Grand Hotel',
      address: '123 Victoria Island, Lagos, Nigeria',
      phone: '+234 1 234 5678',
      email: 'info@lagosgrandhotel.com',
      taxId: 'TIN: 12345678-0001'
    };

    const hotel = hotelInfo || defaultHotelInfo;

    const receiptStyles = isA4 
      ? "max-w-2xl mx-auto p-8 bg-white text-black" 
      : "max-w-sm mx-auto p-4 bg-white text-black font-mono text-sm";

    const formatPrice = (amount: number) => `₦${(amount / 100).toFixed(2)}`;

    const subtotal = order.items.reduce((sum, item) => {
      const itemPrice = item.qty * item.menu_item.base_price;
      const modifiersPrice = item.modifiers.reduce((modSum, mod) => modSum + mod.price_delta, 0);
      return sum + itemPrice + modifiersPrice;
    }, 0);

    const tax = Math.round(subtotal * 0.075); // 7.5% VAT
    const total = subtotal + tax;

    return (
      <div ref={ref} className={receiptStyles}>
        {/* Header */}
        <div className={`text-center mb-6 ${isA4 ? 'space-y-2' : 'space-y-1'}`}>
          <h1 className={`font-bold ${isA4 ? 'text-2xl' : 'text-lg'}`}>
            {hotel.name}
          </h1>
          <p className={`text-muted-foreground ${isA4 ? 'text-base' : 'text-xs'}`}>
            {hotel.address}
          </p>
          <p className={`text-muted-foreground ${isA4 ? 'text-sm' : 'text-xs'}`}>
            Tel: {hotel.phone}
          </p>
          {hotel.email && (
            <p className={`text-muted-foreground ${isA4 ? 'text-sm' : 'text-xs'}`}>
              Email: {hotel.email}
            </p>
          )}
          {hotel.taxId && (
            <p className={`text-muted-foreground ${isA4 ? 'text-sm' : 'text-xs'}`}>
              {hotel.taxId}
            </p>
          )}
        </div>

        <Separator className="my-4" />

        {/* Order Info */}
        <div className={`space-y-2 mb-4 ${isA4 ? 'text-base' : 'text-xs'}`}>
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-mono">{order.order_number}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{new Date(order.created_at).toLocaleTimeString()}</span>
          </div>

          {order.room_id && (
            <div className="flex justify-between">
              <span>Room:</span>
              <span className="font-semibold">#{order.room_id}</span>
            </div>
          )}

          {order.guest_id && (
            <div className="flex justify-between">
              <span>Guest:</span>
              <span>{order.guest_id}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Source:</span>
            <Badge variant="outline" className={`${isA4 ? 'text-sm' : 'text-xs'} capitalize`}>
              {order.source}
            </Badge>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Items */}
        <div className="space-y-3 mb-4">
          <h3 className={`font-semibold ${isA4 ? 'text-lg' : 'text-sm'}`}>Order Items</h3>
          
          {order.items.map((item, index) => {
            const itemPrice = item.qty * item.menu_item.base_price;
            const modifiersPrice = item.modifiers.reduce((sum, mod) => sum + mod.price_delta, 0);
            const totalItemPrice = itemPrice + modifiersPrice;

            return (
              <div key={index} className={`space-y-1 ${isA4 ? 'text-sm' : 'text-xs'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-medium">
                      {item.qty}x {item.menu_item.name}
                    </span>
                    <div className="text-muted-foreground">
                      @ {formatPrice(item.menu_item.base_price)} each
                    </div>
                  </div>
                  <span className="font-medium">
                    {formatPrice(itemPrice)}
                  </span>
                </div>

                {item.modifiers.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {item.modifiers.map((mod, modIndex) => (
                      <div key={modIndex} className="flex justify-between text-muted-foreground">
                        <span>+ {mod.name}</span>
                        <span>{formatPrice(mod.price_delta)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className="ml-4 text-muted-foreground italic">
                    Note: {item.notes}
                  </div>
                )}

                {item.modifiers.length > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Item Subtotal:</span>
                    <span>{formatPrice(totalItemPrice)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Totals */}
        <div className={`space-y-2 ${isA4 ? 'text-base' : 'text-sm'}`}>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>VAT (7.5%):</span>
            <span>{formatPrice(tax)}</span>
          </div>
          
          <Separator className="my-2" />
          
          <div className={`flex justify-between font-bold ${isA4 ? 'text-lg' : 'text-base'}`}>
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Payment Info */}
        <div className={`space-y-2 ${isA4 ? 'text-sm' : 'text-xs'}`}>
          <div className="flex justify-between">
            <span>Payment Status:</span>
            <Badge 
              variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {order.payment_status}
            </Badge>
          </div>
          
          {order.payment_status === 'paid' && (
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 space-y-2 ${isA4 ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
          <p>Thank you for dining with us!</p>
          <p>Please visit us again soon.</p>
          
          {isA4 && (
            <>
              <div className="mt-4">
                <p>Customer Service: {hotel.phone}</p>
                {hotel.email && <p>Email: {hotel.email}</p>}
              </div>
              
              <div className="mt-6 text-xs">
                <p>This is a computer-generated receipt.</p>
                <p>No signature required.</p>
              </div>
            </>
          )}
        </div>

        {/* QR Code placeholder for future implementation */}
        {isA4 && (
          <div className="text-center mt-6">
            <div className="inline-block p-4 border-2 border-dashed border-muted-foreground/30">
              <p className="text-xs text-muted-foreground">QR Code</p>
              <p className="text-xs text-muted-foreground">For Digital Receipt</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;