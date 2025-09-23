import React, { useState } from 'react';
import { Coffee, Plus, Minus, Check, Clock, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ChatInterface from '@/components/guest/messaging/ChatInterface';

interface RoomServiceMenuProps {
  qrToken: string;
  sessionToken: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

export default function RoomServiceMenu({ qrToken, sessionToken }: RoomServiceMenuProps) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Sample menu items
  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Continental Breakfast',
      description: 'Toast, eggs, bacon, coffee, juice',
      price: 2500,
      category: 'Breakfast',
      available: true
    },
    {
      id: '2',
      name: 'Jollof Rice with Chicken',
      description: 'Traditional Nigerian jollof rice with grilled chicken',
      price: 3500,
      category: 'Main Course',
      available: true
    },
    {
      id: '3',
      name: 'Club Sandwich',
      description: 'Triple-layer sandwich with fries',
      price: 2800,
      category: 'Light Meals',
      available: true
    },
    {
      id: '4',
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 800,
      category: 'Beverages',
      available: true
    },
    {
      id: '5',
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake slice',
      price: 1500,
      category: 'Desserts',
      available: false
    }
  ];

  const categories = ['Breakfast', 'Main Course', 'Light Meals', 'Beverages', 'Desserts'];

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to your order');
      return;
    }

    setSubmitting(true);
    try {
      const orderDetails = {
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        special_instructions: specialInstructions,
        total_amount: getTotalPrice(),
        currency: 'NGN'
      };

      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${qrToken}/room-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_session_id: sessionToken,
          order_details: orderDetails,
          total_amount: getTotalPrice(),
          priority: 2,
          notes: `Room service order: ${cart.length} items, Total: ₦${getTotalPrice().toLocaleString()}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        setOrderId(result.order_id);
        setSubmitted(true);
        setShowChat(true);
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting room service order:', error);
      alert('Failed to submit your order. Please try again or contact the front desk.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Placed Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              Your room service order has been sent to our kitchen. 
              Estimated delivery time: 30-45 minutes.
            </p>
            <div className="text-sm text-muted-foreground mb-4">
              Total: ₦{getTotalPrice().toLocaleString()}
            </div>
            
            {!showChat && orderId && (
              <Button 
                onClick={() => setShowChat(true)}
                variant="outline"
                className="mt-2"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with Kitchen
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        {showChat && orderId && (
          <ChatInterface 
            qrOrderId={orderId}
            qrToken={qrToken}
            sessionToken={sessionToken}
            orderStatus="pending"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Menu Categories */}
      {categories.map(category => {
        const categoryItems = menuItems.filter(item => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryItems.map(item => {
                const cartItem = cart.find(cartItem => cartItem.id === item.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.name}</h4>
                        {!item.available && (
                          <Badge variant="destructive" className="text-xs">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm font-medium">₦{item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {quantity > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                      {quantity > 0 && (
                        <span className="w-8 text-center font-medium">{quantity}</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCart(item)}
                        disabled={!item.available}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-medium">
                <span>Total</span>
                <span>₦{getTotalPrice().toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Special Instructions (Optional)</label>
              <Textarea
                placeholder="Any special requests or dietary requirements..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Estimated delivery time: 30-45 minutes. Payment will be added to your room bill.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Order Button */}
      {cart.length > 0 && (
        <Button 
          onClick={submitOrder}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? 'Placing Order...' : `Place Order - ₦${getTotalPrice().toLocaleString()}`}
        </Button>
      )}
    </div>
  );
}