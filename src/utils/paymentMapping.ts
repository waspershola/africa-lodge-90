import type { PaymentMethod } from '@/contexts/PaymentMethodsContext';

/**
 * PHASE 1 FIX: Dynamic Payment Method Mapping
 * Maps hotel-configured payment methods to database canonical types
 * Prevents "payments_payment_method_check" constraint violations
 */

// Database canonical payment types (from payments table constraint)
export type CanonicalPaymentType = 'cash' | 'card' | 'transfer' | 'pos' | 'credit' | 'digital';

/**
 * Map configured payment method to canonical database type
 * Uses intelligent mapping rules based on method name and type
 */
export function mapPaymentMethodToCanonical(
  paymentMethod: PaymentMethod
): CanonicalPaymentType {
  const methodName = paymentMethod.name.toLowerCase();
  const methodType = paymentMethod.type;

  // Direct type mapping (if already canonical)
  if (['cash', 'card', 'transfer', 'pos', 'credit', 'digital'].includes(methodType)) {
    return methodType as CanonicalPaymentType;
  }

  // Intelligent name-based mapping for common payment methods
  if (methodName.includes('pos') || methodName.includes('moniepoint')) {
    return 'pos';
  }
  
  if (methodName.includes('bank') || methodName.includes('transfer') || methodName.includes('wire')) {
    return 'transfer';
  }
  
  if (methodName.includes('card') || methodName.includes('debit') || methodName.includes('credit card')) {
    return 'card';
  }
  
  if (methodName.includes('digital') || methodName.includes('wallet') || methodName.includes('mobile money')) {
    return 'digital';
  }
  
  if (methodName.includes('cash')) {
    return 'cash';
  }
  
  if (methodName.includes('credit') || methodName.includes('invoice')) {
    return 'credit';
  }

  // Fallback: use the configured type or default to 'cash'
  return methodType as CanonicalPaymentType || 'cash';
}

/**
 * Validate if payment method exists and is enabled
 */
export function validatePaymentMethod(
  methodId: string,
  enabledMethods: PaymentMethod[]
): { valid: boolean; error?: string; method?: PaymentMethod } {
  const method = enabledMethods.find(m => m.id === methodId);
  
  if (!method) {
    return {
      valid: false,
      error: 'Selected payment method not found'
    };
  }
  
  if (!method.enabled) {
    return {
      valid: false,
      error: `${method.name} is currently disabled. Please select another payment method.`
    };
  }
  
  return {
    valid: true,
    method
  };
}

/**
 * Get payment method by ID with canonical mapping
 */
export function getCanonicalPaymentType(
  methodId: string,
  enabledMethods: PaymentMethod[]
): CanonicalPaymentType | null {
  const method = enabledMethods.find(m => m.id === methodId);
  if (!method) return null;
  
  return mapPaymentMethodToCanonical(method);
}
