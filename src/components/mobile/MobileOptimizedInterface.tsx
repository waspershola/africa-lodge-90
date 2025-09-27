/**
 * Mobile Optimized Interface Component
 * 
 * Provides responsive, touch-friendly interface optimizations for mobile devices.
 * Includes swipe gestures, larger touch targets, and mobile-specific UI patterns.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { 
  Menu, 
  Bell, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  RefreshCw,
  Settings,
  User,
  Home,
  Calendar,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface MobileInterfaceProps {
  children?: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  showFilter?: boolean;
  onSearch?: (term: string) => void;
  onFilter?: () => void;
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
}

export function MobileOptimizedInterface({
  children,
  title = "Dashboard",
  showSearch = true,
  showFilter = false,
  onSearch,
  onFilter,
  actions = []
}: MobileInterfaceProps) {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && !showMobileMenu) {
      setShowMobileMenu(true);
    } else if (isRightSwipe && showMobileMenu) {
      setShowMobileMenu(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  };

  if (!isMobile) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <MobileNavigation onNavigate={() => setShowMobileMenu(false)} />
              </SheetContent>
            </Sheet>
            
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            
            {actions.length > 0 && (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Actions</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-2">
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        className="w-full justify-start text-left"
                        onClick={action.onClick}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        {(showSearch || showFilter) && (
          <div className="px-4 pb-4 flex gap-2">
            {showSearch && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                />
              </div>
            )}
            
            {showFilter && (
              <Button variant="outline" size="sm" onClick={onFilter}>
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  const menuItems = [
    { label: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/' },
    { label: 'QR Requests', icon: <MessageSquare className="h-5 w-5" />, path: '/qr-requests' },
    { label: 'Schedule', icon: <Calendar className="h-5 w-5" />, path: '/schedule' },
    { label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, path: '/analytics' },
    { label: 'Profile', icon: <User className="h-5 w-5" />, path: '/profile' },
    { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' }
  ];

  return (
    <div className="py-4 space-y-2">
      {menuItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          className="w-full justify-start text-left"
          onClick={() => {
            // Navigate to item.path
            onNavigate();
          }}
        >
          {item.icon}
          <span className="ml-3">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}

function MobileBottomNav() {
  const navItems = [
    { label: 'Home', icon: <Home className="h-5 w-5" />, active: true },
    { label: 'Requests', icon: <MessageSquare className="h-5 w-5" /> },
    { label: 'Add', icon: <Plus className="h-5 w-5" /> },
    { label: 'Schedule', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Profile', icon: <User className="h-5 w-5" /> }
  ];

  return (
    <div className="sticky bottom-0 bg-background border-t">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
              item.active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

// Mobile-optimized card component
export function MobileCard({ 
  title, 
  children, 
  actions,
  swipeActions 
}: {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  swipeActions?: {
    left?: { icon: React.ReactNode; action: () => void; color?: string };
    right?: { icon: React.ReactNode; action: () => void; color?: string };
  };
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number>(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX.current;
    setSwipeOffset(Math.max(-100, Math.min(100, diff)));
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    
    if (Math.abs(swipeOffset) > 50) {
      if (swipeOffset > 50 && swipeActions?.right) {
        swipeActions.right.action();
      } else if (swipeOffset < -50 && swipeActions?.left) {
        swipeActions.left.action();
      }
    }
    
    setSwipeOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe Actions Background */}
      {swipeActions && (
        <>
          {swipeActions.left && (
            <div className={`absolute inset-y-0 right-0 w-20 flex items-center justify-center ${
              swipeActions.left.color || 'bg-red-500'
            } transition-transform duration-200`}
            style={{ transform: `translateX(${Math.min(0, swipeOffset + 100)}px)` }}>
              <div className="text-white">
                {swipeActions.left.icon}
              </div>
            </div>
          )}
          
          {swipeActions.right && (
            <div className={`absolute inset-y-0 left-0 w-20 flex items-center justify-center ${
              swipeActions.right.color || 'bg-green-500'
            } transition-transform duration-200`}
            style={{ transform: `translateX(${Math.max(0, swipeOffset - 100)}px)` }}>
              <div className="text-white">
                {swipeActions.right.icon}
              </div>
            </div>
          )}
        </>
      )}

      {/* Card Content */}
      <Card 
        className="transform transition-transform duration-200"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {title && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {actions}
          </CardHeader>
        )}
        <CardContent className={title ? "pt-0" : "p-4"}>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

// Touch-friendly button with haptic feedback simulation
export function MobileTouchButton({ 
  children, 
  onClick, 
  variant = 'default',
  size = 'default',
  className = '',
  ...props 
}: any) {
  const handleTouch = () => {
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onClick?.();
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`min-h-[44px] min-w-[44px] active:scale-95 transition-transform ${className}`}
      onClick={handleTouch}
      {...props}
    >
      {children}
    </Button>
  );
}