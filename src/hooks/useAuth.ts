import { useState, useEffect, createContext, useContext } from 'react';

export type UserRole = 'staff' | 'chef' | 'manager' | 'owner' | 'accountant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  tenant_id: string;
  department?: string;
  shift_start?: string;
  shift_end?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccess: (requiredRole: UserRole | UserRole[]) => boolean;
}

// Mock user for frontend development
const mockUser: User = {
  id: 'user-123',
  email: 'staff@hotel.com',
  name: 'John Doe',
  role: 'staff',
  permissions: [
    'pos:view_orders',
    'pos:accept_orders',
    'pos:update_status',
    'kds:view_tickets',
    'kds:claim_tickets',
    'kds:complete_tickets'
  ],
  tenant_id: 'hotel-1',
  department: 'restaurant',
  shift_start: '08:00',
  shift_end: '16:00'
};

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setUser(mockUser); // In production, this will come from Supabase
      setIsLoading(false);
    }, 1000);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // This will be replaced with Supabase auth
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  };

  const logout = () => {
    setUser(null);
    // Clear any stored tokens/sessions
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'owner';
  };

  const canAccess = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Owner can access everything
    if (user.role === 'owner') return true;
    
    // Manager can access staff and chef functions
    if (user.role === 'manager' && roles.some(r => ['staff', 'chef'].includes(r))) {
      return true;
    }
    
    return roles.includes(user.role);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    canAccess
  };
};

// Role hierarchy for UI restrictions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  staff: 1,
  chef: 2,
  manager: 3,
  accountant: 3,
  owner: 4
};

export const canUserModifyPrice = (userRole: UserRole, priceChange: number): boolean => {
  // Staff can't change prices
  if (userRole === 'staff' || userRole === 'chef') return false;
  
  // Manager can change prices within limits (up to 20%)
  if (userRole === 'manager') {
    return Math.abs(priceChange) <= 0.20;
  }
  
  // Owner and accountant can change any price
  return userRole === 'owner' || userRole === 'accountant';
};