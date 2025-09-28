import React from 'react';
import { CreditCard, Banknote, Smartphone, Building2, Clock, UserX, ArrowRightLeft } from 'lucide-react';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export const usePaymentMethods = () => {
  // Get payment methods from context (configured in financials dashboard)
  const { paymentMethods, enabledMethods } = usePaymentMethodsContext();

  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote':
        return React.createElement(Banknote, { className: "h-4 w-4" });
      case 'CreditCard':
        return React.createElement(CreditCard, { className: "h-4 w-4" });
      case 'Building':
        return React.createElement(Building2, { className: "h-4 w-4" });
      case 'Smartphone':
        return React.createElement(Smartphone, { className: "h-4 w-4" });
      case 'Clock':
        return React.createElement(Clock, { className: "h-4 w-4" });
      case 'UserX':
        return React.createElement(UserX, { className: "h-4 w-4" });
      case 'ArrowRightLeft':
        return React.createElement(ArrowRightLeft, { className: "h-4 w-4" });
      default:
        return React.createElement(CreditCard, { className: "h-4 w-4" });
    }
  };

  return {
    paymentMethods,
    enabledMethods,
    getMethodIcon,
  };
};