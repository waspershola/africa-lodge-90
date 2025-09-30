import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { toast } from 'sonner';

export const usePaymentValidation = () => {
  const { enabledMethods, getMethodById, calculateFees } = usePaymentMethodsContext();

  const validatePaymentMethod = (methodId: string): boolean => {
    const method = getMethodById(methodId);
    
    if (!method) {
      toast.error('Invalid payment method selected');
      return false;
    }

    if (!method.enabled) {
      toast.error(`${method.name} is currently disabled. Please select another payment method.`);
      return false;
    }

    return true;
  };

  const getPaymentMethodName = (methodId: string): string => {
    const method = getMethodById(methodId);
    return method?.name || 'Unknown Method';
  };

  const isPaymentMethodAvailable = (methodName: string): boolean => {
    return enabledMethods.some(m => 
      m.name.toLowerCase() === methodName.toLowerCase()
    );
  };

  const getPaymentTotal = (amount: number, methodId: string): {
    subtotal: number;
    fees: number;
    total: number;
  } => {
    const fees = calculateFees(amount, methodId);
    return {
      subtotal: amount,
      fees,
      total: amount + fees
    };
  };

  const hasEnabledMethods = (): boolean => {
    return enabledMethods.length > 0;
  };

  const getMethodByType = (type: string) => {
    return enabledMethods.find(m => m.type === type);
  };

  return {
    enabledMethods,
    validatePaymentMethod,
    getPaymentMethodName,
    isPaymentMethodAvailable,
    getPaymentTotal,
    hasEnabledMethods,
    getMethodByType,
    calculateFees
  };
};
