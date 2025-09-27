import React from 'react';
import { CreditCard, Banknote, Smartphone, Building2, Clock } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export const usePaymentMethods = () => {
  // Payment methods as per blueprint specifications
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      name: 'Cash',
      icon: 'banknote',
      enabled: true,
    },
    {
      id: 'moniepoint_pos',
      name: 'Moniepoint POS',
      icon: 'credit-card',
      enabled: true,
    },
    {
      id: 'opay_pos',
      name: 'Opay POS',
      icon: 'credit-card',
      enabled: true,
    },
    {
      id: 'zenith_transfer',
      name: 'Zenith Transfer',
      icon: 'building',
      enabled: true,
    },
    {
      id: 'pay_later',
      name: 'Pay Later',
      icon: 'clock',
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
      case 'clock':
        return React.createElement(Clock, { className: "h-4 w-4" });
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