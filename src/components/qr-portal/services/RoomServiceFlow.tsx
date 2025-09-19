import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  CheckCircle
} from 'lucide-react';
import { QRSession } from '@/hooks/useQRSession';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prep_time: number;
  available: boolean;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface RoomServiceFlowProps {
  session: QRSession;
  onBack: () => void;
  onRequestCreate: (type: string, data: any) => void;
}

// Mock menu data - in production this would come from the backend
const mockMenu: MenuItem[] = [
  {
    id: 'item-1',
    name: 'Jollof Rice & Grilled Chicken',
    description: 'Traditional Nigerian jollof rice with perfectly grilled chicken breast',
    price: 3500,
    category: 'Main Course',
    prep_time: 25,
    available: true
  },
  {
    id: 'item-2',
    name: 'Pepper Soup (Goat Meat)',
    description: 'Spicy Nigerian pepper soup with tender goat meat and local spices',
    price: 4200,
    category: 'Soups',
    prep_time: 20,
    available: true
  },
  {
    id: 'item-3',
    name: 'Suya Platter',
    description: 'Grilled beef suya with onions, tomatoes, and spicy pepper sauce',
    price: 2800,
    category: 'Appetizers',
    prep_time: 15,
    available: true
  },
  {
    id: 'item-4',
    name: 'Chapman Cocktail',
    description: 'Refreshing Nigerian cocktail with grenadine, cucumber, and orange',
    price: 1500,
    category: 'Beverages',
    prep_time: 5,
    available: true
  }
];

const categories = ['All', 'Main Course', 'Soups', 'Appetizers', 'Beverages'];

export const RoomServiceFlow = ({ session, onBack, onRequestCreate }: RoomServiceFlowProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'menu' | 'cart' | 'checkout' | 'confirmation'>('menu');
  const [guestName, setGuestName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = selectedCategory === 'All' 
    ? mockMenu 
    : mockMenu.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getEstimatedTime = () => {
    if (cart.length === 0) return 0;
    return Math.max(...cart.map(item => item.prep_time)) + 10; // +10 for delivery
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    
    try {
      await onRequestCreate('room-service', {
        title: `Room Service Order - Room ${session.room_id}`,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total_amount: getTotalPrice(),
        guest_name: guestName,
        special_instructions: specialInstructions,
        estimated_prep_time: getEstimatedTime(),
        room_id: session.room_id
      });
      
      setStep('confirmation');
    } catch (error) {
      console.error('Failed to submit order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-4">
            Your room service order has been sent to the kitchen. You'll receive updates as your order is prepared.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Estimated delivery: {getEstimatedTime()} minutes</span>
            </div>
          </div>
          <Button onClick={onBack} className="w-full">
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="p-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('cart')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="font-semibold">Checkout</h1>
              <div></div>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Guest Name</label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Room Number</label>
                <Input
                  value={session.room_id}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Special Instructions</label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any dietary restrictions or special requests..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Estimated delivery: {getEstimatedTime()} minutes</span>
            </div>
          </div>

          <Button
            onClick={handleSubmitOrder}
            disabled={!guestName || isSubmitting}
            className="w-full h-12"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Placing Order...
              </>
            ) : (
              <>Place Order - {formatPrice(getTotalPrice())}</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'cart') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="p-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('menu')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Menu
              </Button>
              <h1 className="font-semibold">Cart ({getTotalItems()})</h1>
              <div></div>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto">
          {cart.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Cart is Empty</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add items from the menu to get started.
                </p>
                <Button onClick={() => setStep('menu')}>
                  Browse Menu
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} each
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => setStep('checkout')}
                className="w-full h-12"
              >
                Proceed to Checkout
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="font-semibold">Room Service Menu</h1>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep('cart')}>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {getTotalItems()}
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 max-w-md mx-auto">
        <div className="space-y-4">
          {filteredItems.map(item => (
            <Card key={item.id} className={!item.available ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <span className="font-bold text-primary text-xl">
                    {formatPrice(item.price)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{item.prep_time} min</span>
                    </div>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  
                  {item.available ? (
                    <div className="flex items-center gap-2">
                      {cart.find(cartItem => cartItem.id === item.id) ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Unavailable
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="max-w-md mx-auto">
            <Button
              onClick={() => setStep('cart')}
              className="w-full h-14 text-lg shadow-lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              View Cart ({getTotalItems()}) - {formatPrice(getTotalPrice())}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};