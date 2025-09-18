import { useState, useEffect } from 'react';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'pos' | 'digital' | 'transfer' | 'cash' | 'credit';
  icon: string;
  enabled: boolean;
  fees?: {
    percentage: number;
    fixed: number;
  };
}

// This would normally come from backend/context
const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'cash',
    icon: 'Banknote',
    enabled: true
  },
  {
    id: 'moniepoint-pos',
    name: 'Moniepoint POS',
    type: 'pos',
    icon: 'CreditCard',
    enabled: true,
    fees: { percentage: 0.75, fixed: 0 }
  },
  {
    id: 'opay-pos',
    name: 'Opay POS',
    type: 'pos',
    icon: 'CreditCard',
    enabled: false,
    fees: { percentage: 0.5, fixed: 0 }
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    type: 'transfer',
    icon: 'Bank',
    enabled: true,
    fees: { percentage: 0, fixed: 50 }
  },
  {
    id: 'paystack',
    name: 'Paystack Online',
    type: 'digital',
    icon: 'Smartphone',
    enabled: false,
    fees: { percentage: 1.5, fixed: 100 }
  },
  {
    id: 'pay-later',
    name: 'Pay Later',
    type: 'credit',
    icon: 'Clock',
    enabled: true
  },
  {
    id: 'debtor',
    name: 'Debtor Account',
    type: 'credit',
    icon: 'UserX',
    enabled: true
  }
];

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);

  // Get only enabled payment methods for selection
  const getEnabledMethods = () => {
    return paymentMethods.filter(method => method.enabled);
  };

  // Get payment method by ID
  const getMethodById = (id: string) => {
    return paymentMethods.find(method => method.id === id);
  };

  return {
    paymentMethods,
    enabledMethods: getEnabledMethods(),
    getMethodById,
    setPaymentMethods
  };
};