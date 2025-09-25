import React from 'react';
import { CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export const usePaymentMethods = () => {
  // In a real implementation, this would come from hotel settings
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      name: 'Cash',
      icon: 'banknote',
      enabled: true,
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'credit-card',
      enabled: true,
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: 'building',
      enabled: true,
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: 'smartphone',
      enabled: true,
    },
  ];

  const enabledMethods = paymentMethods.filter(method => method.enabled);

  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'banknote':
        return React.createElement(Banknote, { className: "h-4 w-4" });
      case 'credit-card':
        return React.createElement(CreditCard, { className: "h-4 w-4" });
      case 'building':
        return React.createElement(Building2, { className: "h-4 w-4" });
      case 'smartphone':
        return React.createElement(Smartphone, { className: "h-4 w-4" });
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