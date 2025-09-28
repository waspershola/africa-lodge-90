import React, { createContext, useContext, useState } from 'react';

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
  config?: any;
}

const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'cash',
    icon: 'Banknote',
    enabled: true
  },
  {
    id: 'moniepoint_pos',
    name: 'Moniepoint POS',
    type: 'pos',
    icon: 'CreditCard',
    enabled: true,
    fees: { percentage: 1.5, fixed: 0 }
  },
  {
    id: 'opay_pos',
    name: 'Opay POS',
    type: 'pos',
    icon: 'CreditCard',
    enabled: true,
    fees: { percentage: 1.5, fixed: 0 }
  },
  {
    id: 'zenith_transfer',
    name: 'Zenith Transfer',
    type: 'transfer',
    icon: 'Building',
    enabled: true,
    fees: { percentage: 0, fixed: 25 }
  },
  {
    id: 'pay_later',
    name: 'Pay Later',
    type: 'credit',
    icon: 'Clock',
    enabled: true
  }
];

interface PaymentMethodsContextType {
  paymentMethods: PaymentMethod[];
  enabledMethods: PaymentMethod[];
  updatePaymentMethods: (methods: PaymentMethod[]) => void;
  getMethodById: (id: string) => PaymentMethod | undefined;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextType | undefined>(undefined);

export const PaymentMethodsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);

  const enabledMethods = paymentMethods.filter(method => method.enabled);

  const updatePaymentMethods = (methods: PaymentMethod[]) => {
    setPaymentMethods(methods);
  };

  const getMethodById = (id: string) => {
    return paymentMethods.find(method => method.id === id);
  };

  return (
    <PaymentMethodsContext.Provider
      value={{
        paymentMethods,
        enabledMethods,
        updatePaymentMethods,
        getMethodById,
      }}
    >
      {children}
    </PaymentMethodsContext.Provider>
  );
};

export const usePaymentMethodsContext = () => {
  const context = useContext(PaymentMethodsContext);
  if (context === undefined) {
    throw new Error('usePaymentMethodsContext must be used within a PaymentMethodsProvider');
  }
  return context;
};