/**
 * Centralized payment method mapping utility
 * Maps tenant-configured payment method names/types to database canonical values
 * 
 * Database constraint allows: cash, card, transfer, pos, credit, digital, complimentary
 */

const CANONICAL_METHODS = ['cash', 'card', 'transfer', 'pos', 'credit', 'digital', 'complimentary'] as const;
export type CanonicalPaymentMethod = typeof CANONICAL_METHODS[number];

/**
 * Maps various payment method inputs to canonical database values
 * Handles common variations and POS system names
 */
export function mapToCanonicalPaymentMethod(input: string): CanonicalPaymentMethod {
  const normalized = input?.toString().trim().toLowerCase();
  
  if (!normalized) {
    throw new Error('Payment method cannot be empty');
  }

  // Direct matches first (most common case)
  if (CANONICAL_METHODS.includes(normalized as any)) {
    return normalized as CanonicalPaymentMethod;
  }

  // POS and card variations
  if (
    normalized.includes('pos') || 
    normalized.includes('moniepoint') ||
    normalized.includes('opay') ||
    normalized.includes('paystack') ||
    normalized.includes('monnify') ||
    normalized.includes('debit') ||
    normalized.includes('credit card') ||
    normalized.includes('mastercard') ||
    normalized.includes('visa')
  ) {
    return 'card';
  }

  // Transfer variations
  if (
    normalized.includes('transfer') ||
    normalized.includes('bank') ||
    normalized.includes('fcmb') ||
    normalized.includes('gtb') ||
    normalized.includes('uba') ||
    normalized.includes('zenith') ||
    normalized.includes('access') ||
    normalized.includes('wire') ||
    normalized.includes('ussd')
  ) {
    return 'transfer';
  }

  // Cash variations
  if (normalized.includes('cash') || normalized.includes('naira')) {
    return 'cash';
  }

  // Credit/Pay later variations
  if (
    normalized.includes('credit') ||
    normalized.includes('pay later') ||
    normalized.includes('invoice') ||
    normalized.includes('account')
  ) {
    return 'credit';
  }

  // Digital wallet variations
  if (
    normalized.includes('digital') ||
    normalized.includes('wallet') ||
    normalized.includes('mobile money') ||
    normalized.includes('paga') ||
    normalized.includes('quickteller')
  ) {
    return 'digital';
  }

  // Complimentary variations
  if (
    normalized.includes('complimentary') ||
    normalized.includes('comp') ||
    normalized.includes('free') ||
    normalized.includes('waived')
  ) {
    return 'complimentary';
  }

  // If no match found, throw error with helpful message
  throw new Error(
    `Unsupported payment method: "${input}". ` +
    `Supported methods: ${CANONICAL_METHODS.join(', ')}. ` +
    `Please configure this payment method in Financial Settings.`
  );
}

/**
 * Validates if a payment method is canonical
 */
export function isCanonicalPaymentMethod(method: string): boolean {
  return CANONICAL_METHODS.includes(method.toLowerCase() as any);
}

/**
 * Gets all supported canonical payment methods
 */
export function getCanonicalPaymentMethods(): readonly CanonicalPaymentMethod[] {
  return CANONICAL_METHODS;
}

/**
 * Maps payment method with detailed logging for debugging
 */
export function mapPaymentMethodWithLogging(input: string, context?: string): CanonicalPaymentMethod {
  console.log(`[Payment Mapper ${context || ''}] Input:`, input);
  
  try {
    const canonical = mapToCanonicalPaymentMethod(input);
    console.log(`[Payment Mapper ${context || ''}] Mapped to:`, canonical);
    return canonical;
  } catch (error) {
    console.error(`[Payment Mapper ${context || ''}] Error:`, error);
    throw error;
  }
}
