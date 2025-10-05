/**
 * Payment Business Rules & Validation
 * Phase 2: Payment Logic Enforcement
 */

import type { PaymentMethod } from '@/contexts/PaymentMethodsContext';

export type PaymentStatus = 'paid' | 'unpaid' | 'pending';

/**
 * Determine payment status based on payment method type and verification state
 * 
 * Rules:
 * - Cash: Immediate payment (paid)
 * - POS/Digital/Transfer: Requires verification (pending → paid)
 * - Credit/Pay Later: ALWAYS unpaid until real payment received
 */
export function determinePaymentStatus(
  methodType: PaymentMethod['type'],
  isVerified: boolean = false
): PaymentStatus {
  switch (methodType) {
    case 'cash':
      return 'paid'; // Cash is immediate
    
    case 'pos':
    case 'digital':
    case 'transfer':
      return isVerified ? 'paid' : 'pending'; // Needs verification
    
    case 'credit': // Pay Later / Invoice
      return 'unpaid'; // ALWAYS unpaid until real payment received
    
    default:
      return 'pending';
  }
}

/**
 * Validate if a payment method is allowed to be marked as "paid"
 * Blocks credit/pay later from being marked as paid
 */
export function canMarkAsPaid(methodType: PaymentMethod['type']): boolean {
  return methodType !== 'credit';
}

/**
 * Get user-friendly error message for invalid payment operations
 */
export function getPaymentValidationError(methodType: PaymentMethod['type']): string {
  if (methodType === 'credit') {
    return 'Pay Later cannot be marked as Paid. Please select a valid payment method.';
  }
  return 'Invalid payment method selected.';
}

/**
 * Check if payment method requires terminal selection
 */
export function requiresTerminal(methodType: PaymentMethod['type']): boolean {
  return methodType === 'pos';
}

/**
 * Check if payment method requires verification
 */
export function requiresVerification(methodType: PaymentMethod['type']): boolean {
  return ['pos', 'digital', 'transfer'].includes(methodType);
}
