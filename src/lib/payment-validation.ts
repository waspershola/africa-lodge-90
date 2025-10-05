/**
 * Payment Method Validation Utilities
 * Phase 4: Payment Method Hardening
 */

export interface PaymentValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  supportedMethods?: string[];
}

/**
 * Validates payment method on client-side before sending to server
 * Phase 1: Enhanced with dynamic validation support
 */
export function validatePaymentMethod(
  paymentMethod: string,
  paymentMethodId?: string | null
): PaymentValidationResult {
  // If payment_method_id is provided, validation happens server-side
  if (paymentMethodId) {
    return { valid: true };
  }

  // Enhanced: Support both database constraint values and legacy methods
  // Database constraint: cash, card, transfer, pos, credit, digital, complimentary
  const supportedMethods = [
    'cash',
    'card',
    'pos',
    'transfer',
    'credit',
    'digital',
    'complimentary',
    'wallet',
    // Legacy compatibility
    'mobile_money',
    'paystack',
    'flutterwave',
    'pay_later',
    'pay later', // Support both underscore and space variants
    'corporate',
  ];

  if (!paymentMethod || paymentMethod.trim() === '') {
    return {
      valid: false,
      error: 'Payment method is required',
      errorCode: 'METHOD_REQUIRED',
    };
  }

  if (!supportedMethods.includes(paymentMethod.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported payment method: ${paymentMethod}`,
      errorCode: 'INVALID_METHOD',
      supportedMethods,
    };
  }

  return { valid: true };
}

/**
 * Validates payment amount
 */
export function validatePaymentAmount(amount: number): PaymentValidationResult {
  if (amount <= 0) {
    return {
      valid: false,
      error: 'Payment amount must be greater than zero',
      errorCode: 'INVALID_AMOUNT',
    };
  }

  if (!Number.isFinite(amount)) {
    return {
      valid: false,
      error: 'Payment amount must be a valid number',
      errorCode: 'INVALID_AMOUNT_FORMAT',
    };
  }

  return { valid: true };
}

/**
 * Comprehensive payment data validation
 */
export function validatePaymentData(data: {
  amount: number;
  paymentMethod: string;
  paymentMethodId?: string | null;
  folioId?: string;
}): PaymentValidationResult {
  // Validate amount
  const amountValidation = validatePaymentAmount(data.amount);
  if (!amountValidation.valid) {
    return amountValidation;
  }

  // Validate payment method
  const methodValidation = validatePaymentMethod(
    data.paymentMethod,
    data.paymentMethodId
  );
  if (!methodValidation.valid) {
    return methodValidation;
  }

  // Validate folio ID if provided
  if (data.folioId && typeof data.folioId !== 'string') {
    return {
      valid: false,
      error: 'Invalid folio ID',
      errorCode: 'INVALID_FOLIO_ID',
    };
  }

  return { valid: true };
}

/**
 * Parse server error response and return user-friendly message
 */
export function parsePaymentError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  // Handle Supabase/PostgreSQL errors
  if (error?.message) {
    // Check for payment validation errors
    if (error.message.includes('Payment validation failed')) {
      const match = error.message.match(/Payment validation failed: (.+)/);
      return match ? match[1] : 'Payment method validation failed';
    }

    // Check for disabled method
    if (error.message.includes('disabled')) {
      return 'This payment method is currently disabled. Please select another method.';
    }

    // Check for not found
    if (error.message.includes('not found')) {
      return 'Selected payment method not found. Please refresh and try again.';
    }

    return error.message;
  }

  return 'An unexpected error occurred during payment processing';
}
