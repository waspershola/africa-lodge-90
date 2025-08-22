import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Clock,
  Phone,
  User,
  CheckCircle,
  Truck
} from "lucide-react";

// Mock menu data
const mockMenuItems = [
  {
    id: 1,
    name: "Jollof Rice & Grilled Chicken",
    description: "Traditional Nigerian jollof rice with perfectly grilled chicken breast, served with plantain",
    price: 3500,
    category: "Main Course",
    prepTime: 25,
    image: "/api/placeholder/300/200",
    available: true
  },
  {
    id: 2,
    name: "Pepper Soup (Goat Meat)",
    description: "Spicy Nigerian pepper soup with tender goat meat and local spices",
    price: 4200,
    category: "Soups", 
    prepTime: 20,
    image: "/api/placeholder/300/200",
    available: true
  },
  {
    id: 3,
    name: "Suya Platter",
    description: "Grilled beef suya with onions, tomatoes, and spicy pepper sauce",
    price: 2800,
    category: "Appetizers",
    prepTime: 15,
    image: "/api/placeholder/300/200",
    available: true
  },
  {
    id: 4,
    name: "Pounded Yam & Egusi",
    description: "Fresh pounded yam served with rich egusi soup and assorted meat",
    price: 4000,
    category: "Traditional",
    prepTime: 30,
    image: "/api/placeholder/300/200",
    available: true
  },
  {
    id: 5,
    name: "Chapman Cocktail",
    description: "Refreshing Nigerian cocktail with grenadine, cucumber, and orange",
    price: 1500,
    category: "Beverages",
    prepTime: 5,
    image: "/api/placeholder/300/200",
    available: true
  },
  {
    id: 6,
    name: "Chin Chin & Ice Cream",
    description: "Homemade chin chin served with vanilla ice cream",
    price: 1800,
    category: "Desserts",
    prepTime: 10,
    image: "/api/placeholder/300/200",
    available: false
  }
];

const categories = ["All", "Main Course", "Traditional", "Soups", "Appetizers", "Beverages", "Desserts"];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  prepTime: number;
}

interface OrderStatus {
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  estimatedTime: number;
  orderNumber: string;
}

const QRMenu = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderStep, setOrderStep] = useState<'menu' | 'checkout' | 'status'>('menu');
  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', room: '201' });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

  const filteredItems = selectedCategory === "All" 
    ? mockMenuItems 
    : mockMenuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: typeof mockMenuItems[0]) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1,
        prepTime: item.prepTime 
      }];
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 
            ? { ...item, quantity: newQuantity }
            : item;
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
    return Math.max(...cart.map(item => item.prepTime)) + 10; // +10 for delivery
  };

  const placeOrder = () => {
    const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
    setOrderStatus({
      status: 'pending',
      estimatedTime: getEstimatedTime(),
      orderNumber
    });
    setOrderStep('status');
    
    // Simulate order status progression
    setTimeout(() => {
      setOrderStatus(prev => prev ? { ...prev, status: 'preparing' } : null);
    }, 3000);
    
    setTimeout(() => {
      setOrderStatus(prev => prev ? { ...prev, status: 'ready' } : null);
    }, getEstimatedTime() * 60 + 5000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (orderStep === 'status' && orderStatus) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-playfair text-2xl font-bold mb-2">Order Placed!</h1>
            <p className="text-muted-foreground">Order #{orderStatus.orderNumber}</p>
          </div>

          <Card className="luxury-card mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Current Status</span>
                <Badge 
                  variant={orderStatus.status === 'delivered' ? 'default' : 'secondary'}
                  className={
                    orderStatus.status === 'pending' ? 'bg-warning/20 text-warning-foreground' :
                    orderStatus.status === 'preparing' ? 'bg-primary/20 text-primary' :
                    orderStatus.status === 'ready' ? 'bg-accent/20 text-accent-foreground' :
                    'bg-success/20 text-success-foreground'
                  }
                >
                  {orderStatus.status === 'pending' && 'Order Received'}
                  {orderStatus.status === 'preparing' && 'Kitchen Preparing'}
                  {orderStatus.status === 'ready' && 'Ready for Delivery'}
                  {orderStatus.status === 'delivered' && 'Delivered'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    orderStatus.status === 'pending' ? 'bg-warning animate-pulse' : 'bg-success'
                  }`} />
                  <span className="text-sm">Order received</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    orderStatus.status === 'preparing' ? 'bg-primary animate-pulse' :
                    ['ready', 'delivered'].includes(orderStatus.status) ? 'bg-success' : 'bg-muted'
                  }`} />
                  <span className="text-sm">Kitchen preparing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    orderStatus.status === 'ready' ? 'bg-accent animate-pulse' :
                    orderStatus.status === 'delivered' ? 'bg-success' : 'bg-muted'
                  }`} />
                  <span className="text-sm">Ready for delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    orderStatus.status === 'delivered' ? 'bg-success' : 'bg-muted'
                  }`} />
                  <span className="text-sm">Delivered to room</span>
                </div>
              </div>

              {orderStatus.status !== 'delivered' && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Estimated delivery: {orderStatus.estimatedTime} minutes</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="luxury-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
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
                <div className="border-t pt-3 flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={() => {
              setOrderStep('menu');
              setCart([]);
              setOrderStatus(null);
            }}
            variant="outline" 
            className="w-full"
          >
            Order More Items
          </Button>
        </div>
      </div>
    );
  }

  if (orderStep === 'checkout') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-playfair text-2xl font-bold">Checkout</h1>
            <Button variant="ghost" onClick={() => setOrderStep('menu')}>
              Back to Menu
            </Button>
          </div>

          <Card className="luxury-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name
                </label>
                <Input 
                  value={guestInfo.name}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </label>
                <Input 
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Room Number</label>
                <Input 
                  value={guestInfo.room}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="Room 201"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Special Instructions</label>
                <Textarea 
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests or dietary restrictions?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
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
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Delivery to room</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg mt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Clock className="h-4 w-4" />
              <span>Estimated delivery time: {getEstimatedTime()} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              <span>Will be delivered to Room {guestInfo.room}</span>
            </div>
          </div>

          <Button 
            onClick={placeOrder}
            className="w-full bg-gradient-primary"
            size="lg"
            disabled={!guestInfo.name || !guestInfo.phone}
          >
            Place Order - {formatPrice(getTotalPrice())}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-4">
              <h1 className="font-playfair text-2xl font-bold text-gradient">Room Service Menu</h1>
              <p className="text-sm text-muted-foreground">Room 201 • Lagos Grand Hotel</p>
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

      {/* Menu Items */}
      <div className="p-4 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          {filteredItems.map(item => (
            <Card key={item.id} className={`luxury-card ${!item.available ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                      <span className="font-bold text-primary ml-2 flex-shrink-0">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{item.prepTime} min</span>
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
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-medium min-w-[20px] text-center">
                                {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => addToCart(item)}
                              className="bg-gradient-primary"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="max-w-md mx-auto">
            <Button 
              onClick={() => setOrderStep('checkout')}
              className="w-full bg-gradient-primary shadow-luxury"
              size="lg"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>{getTotalItems()} items</span>
                </div>
                <span className="font-bold">{formatPrice(getTotalPrice())}</span>
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRMenu;