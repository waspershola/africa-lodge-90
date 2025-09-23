import React, { useState } from 'react';
import { Coffee, Plus, Minus, Check, Clock, MessageCircle, Crown, Sparkles, ChefHat } from 'lucide-react';
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

  // Luxury menu items
  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Royal Continental Breakfast',
      description: 'Premium toast, organic eggs, artisan bacon, fresh coffee, natural juice',
      price: 3500,
      category: 'Breakfast',
      available: true
    },
    {
      id: '2',
      name: 'Signature Jollof Rice with Grilled Chicken',
      description: 'Traditional Nigerian jollof rice with premium grilled chicken breast',
      price: 4500,
      category: 'Main Course',
      available: true
    },
    {
      id: '3',
      name: 'Gourmet Club Sandwich',
      description: 'Triple-layer artisan sandwich with truffle fries and garden salad',
      price: 3800,
      category: 'Light Meals',
      available: true
    },
    {
      id: '4',
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed premium orange juice',
      price: 1200,
      category: 'Beverages',
      available: true
    },
    {
      id: '5',
      name: 'Luxury Chocolate Cake',
      description: 'Rich Belgian chocolate cake with gold leaf garnish',
      price: 2500,
      category: 'Desserts',
      available: false
    },
    {
      id: '6',
      name: 'Premium Wine Selection',
      description: 'Curated selection of fine wines',
      price: 8500,
      category: 'Beverages',
      available: true
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
        setOrderId(result.request_id);
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
      <div className="space-y-6 animate-fade-in">
        <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-scale-in">
              <Check className="h-10 w-10 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-amber-600" />
              <h3 className="text-2xl font-serif text-amber-900">Order Placed Successfully!</h3>
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-amber-700/80 mb-6 text-lg leading-relaxed">
              Your gourmet order has been sent to our executive chef. 
              Estimated preparation and delivery: 30-45 minutes.
            </p>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200/50 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ChefHat className="h-5 w-5 text-amber-600" />
                <p className="text-amber-900 font-serif text-lg">Order Total</p>
              </div>
              <p className="text-2xl font-bold text-amber-900">₦{getTotalPrice().toLocaleString()}</p>
              <p className="text-amber-700/70 text-sm mt-1">Payment will be added to your room folio</p>
            </div>
            
            {!showChat && orderId && (
              <Button 
                onClick={() => setShowChat(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat with Kitchen Staff
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
    <div className="space-y-6 animate-fade-in">
      {/* Menu Categories */}
      {categories.map(category => {
        const categoryItems = menuItems.filter(item => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <Card key={category} className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200/50">
              <CardTitle className="flex items-center gap-3 text-amber-900">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-serif">{category}</h3>
                  <p className="text-sm text-amber-700/70 font-normal">Premium culinary selections</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {categoryItems.map(item => {
                const cartItem = cart.find(cartItem => cartItem.id === item.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <div 
                    key={item.id} 
                    className={`group p-4 rounded-xl border-2 transition-all duration-300 ${
                      quantity > 0
                        ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 shadow-md'
                        : 'border-amber-200/50 hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-serif text-amber-900 group-hover:text-amber-800 transition-colors duration-300">
                            {item.name}
                          </h4>
                          {!item.available && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                              Temporarily Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-amber-700/70 mb-3 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                          <p className="text-lg font-bold text-amber-900">₦{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {quantity > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-full w-10 h-10 p-0 shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                        {quantity > 0 && (
                          <div className="w-12 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-md">
                            <span className="font-bold text-amber-900">{quantity}</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={!item.available}
                          className={`rounded-full w-10 h-10 p-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 ${
                            item.available
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
        <Card className="shadow-2xl border-amber-200/50 bg-gradient-to-br from-amber-800 to-amber-900 text-white">
          <CardHeader className="border-b border-amber-700/30">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-serif">Your Gourmet Order</h3>
                <p className="text-amber-100/80 text-sm font-normal">{cart.length} item{cart.length !== 1 ? 's' : ''} selected</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">
                      {item.quantity}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-amber-700/30 pt-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-200" />
                  <span className="text-xl font-serif">Total</span>
                </div>
                <span className="text-2xl font-bold">₦{getTotalPrice().toLocaleString()}</span>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-200" />
                <label className="text-amber-100 font-medium">Special Instructions</label>
              </div>
              <Textarea
                placeholder="Dietary preferences, cooking instructions, or special requests..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="bg-white/10 border-amber-600/30 text-white placeholder:text-amber-100/50 focus:border-amber-400 focus:ring-amber-400/20 backdrop-blur-sm"
              />
            </div>

            <Alert className="border-amber-600/30 bg-white/5 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-amber-200" />
              <AlertDescription className="text-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <ChefHat className="h-4 w-4" />
                  <span className="font-medium">Executive Chef Service</span>
                </div>
                Estimated preparation: 30-45 minutes. All charges will be added to your room folio for convenient checkout.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={submitOrder}
              disabled={submitting}
              className="w-full bg-white/10 hover:bg-white/20 text-white border-amber-600/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full py-4 text-lg font-medium"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Placing Your Order...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5" />
                  Place Gourmet Order - ₦{getTotalPrice().toLocaleString()}
                  <Crown className="h-5 w-5" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}