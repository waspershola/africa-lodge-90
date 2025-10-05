/**
 * Payment Business Rules & Validation
 * Phase 2: Payment Logic Enforcement
 */

import type { PaymentMethod } from '@/contexts/PaymentMethodsContext';

export type PaymentStatus = 'paid' | 'unpaid' | 'pending';

/**
 * Determine payment status based on payment method type
 * 
 * Rules:
 * - Cash: Immediate payment (paid)
 * - POS/Digital/Transfer: Immediate payment (paid)
 * - Credit/Pay Later: ALWAYS unpaid until real payment received
 */
export function determinePaymentStatus(
  methodType: PaymentMethod['type']
): PaymentStatus {
  switch (methodType) {
    case 'cash':
    case 'pos':
    case 'digital':
    case 'transfer':
      return 'paid'; // Immediate payment
    
    case 'credit': // Pay Later / Invoice
      return 'unpaid'; // ALWAYS unpaid until real payment received
    
    default:
      return 'paid';
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
 * Check if payment method requires verification (legacy - no longer used)
 * All methods except credit are now paid immediately
 */
export function requiresVerification(methodType: PaymentMethod['type']): boolean {
  return false; // No longer requires verification - all immediate except credit
}
