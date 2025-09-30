import React, { createContext, useContext } from 'react';
import { usePaymentMethodsDB } from '@/hooks/usePaymentMethodsDB';

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

interface PaymentMethodsContextType {
  paymentMethods: PaymentMethod[];
  enabledMethods: PaymentMethod[];
  loading: boolean;
  getMethodById: (id: string) => PaymentMethod | undefined;
  calculateFees: (amount: number, methodId: string) => number;
  refresh: () => Promise<void>;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextType | undefined>(undefined);

export const PaymentMethodsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    paymentMethods, 
    enabledMethods, 
    loading,
    calculateFees,
    refresh
  } = usePaymentMethodsDB();

  const getMethodById = (id: string) => {
    return paymentMethods.find(method => method.id === id);
  };

  return (
    <PaymentMethodsContext.Provider
      value={{
        paymentMethods,
        enabledMethods,
        loading,
        getMethodById,
        calculateFees,
        refresh,
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