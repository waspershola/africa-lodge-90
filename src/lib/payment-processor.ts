/**
 * Payment Processor - Phase 4: Payment Method Logic
 * Handles payment processing with method-specific fees and ledger entries
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProcessPaymentParams {
  folioId: string;
  grossAmount: number;
  paymentMethodId: string;
  tenantId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResult {
  payment: any;
  netAmount: number;
  feeAmount: number;
  ledgerEntryId: string;
}

interface PaymentMethodConfig {
  id: string;
  name: string;
  type: string;
  fee_type?: 'percentage' | 'fixed';
  fee_amount?: number;
  requires_verification?: boolean;
  settlement_type?: 'immediate' | 'delayed' | 'manual';
}

/**
 * Calculate payment fee based on method configuration
 */
function calculatePaymentFee(grossAmount: number, method: PaymentMethodConfig): number {
  if (!method.fee_type || !method.fee_amount) {
    return 0;
  }

  if (method.fee_type === 'percentage') {
    return (grossAmount * method.fee_amount) / 100;
  }

  return method.fee_amount;
}

/**
 * Get payment method configuration
 */
async function getPaymentMethodConfig(paymentMethodId: string): Promise<PaymentMethodConfig> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', paymentMethodId)
    .single();

  if (error || !data) {
    // Fallback to default cash method
    return {
      id: paymentMethodId,
      name: 'Cash',
      type: 'cash',
      fee_type: 'fixed',
      fee_amount: 0,
      requires_verification: false,
      settlement_type: 'immediate'
    };
  }

  return data as PaymentMethodConfig;
}

/**
 * Process payment with automatic fee calculation and ledger entry
 * 
 * This function:
 * 1. Fetches payment method configuration
 * 2. Calculates fees based on method type
 * 3. Creates payment record
 * 4. Creates immutable ledger entry
 * 5. Returns payment details
 */
export async function processPayment(
  params: ProcessPaymentParams
): Promise<ProcessPaymentResult> {
  const { folioId, grossAmount, paymentMethodId, tenantId, userId, metadata } = params;

  // Fetch payment method configuration
  const method = await getPaymentMethodConfig(paymentMethodId);

  // Calculate net amount after fees
  const feeAmount = calculatePaymentFee(grossAmount, method);
  const netAmount = grossAmount - feeAmount;

  console.log('[Payment Processor] Processing payment:', {
    method: method.name,
    gross: grossAmount,
    fee: feeAmount,
    net: netAmount
  });

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      folio_id: folioId,
      tenant_id: tenantId,
      amount: netAmount,
      payment_method_id: paymentMethodId,
      payment_method: method.name,
      status: method.requires_verification ? 'pending' : 'completed',
      processed_by: userId,
      metadata: {
        ...metadata,
        gross_amount: grossAmount,
        fee_amount: feeAmount,
        fee_type: method.fee_type,
        settlement_type: method.settlement_type
      }
    })
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error(`Failed to create payment: ${paymentError?.message}`);
  }

  // Create ledger entry (handled by trigger, but we can create manual entry for fees if needed)
  let ledgerEntryId = '';
  if (feeAmount > 0) {
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('billing_ledger')
      .insert({
        tenant_id: tenantId,
        folio_id: folioId,
        transaction_type: 'fee',
        amount: feeAmount,
        reference_type: 'payment_fee',
        reference_id: payment.id,
        description: `${method.name} processing fee`,
        user_id: userId,
        metadata: {
          payment_method: method.name,
          fee_type: method.fee_type,
          fee_rate: method.fee_amount
        }
      })
      .select('id')
      .single();

    if (!ledgerError && ledgerEntry) {
      ledgerEntryId = ledgerEntry.id;
    }
  }

  console.log('[Payment Processor] Payment processed successfully:', {
    paymentId: payment.id,
    netAmount,
    feeAmount,
    status: payment.status
  });

  return {
    payment,
    netAmount,
    feeAmount,
    ledgerEntryId
  };
}

/**
 * Validate payment amount against folio balance
 */
export async function validatePaymentAmount(
  folioId: string, 
  paymentAmount: number
): Promise<{ valid: boolean; balance: number; message?: string }> {
  const { data: folio, error } = await supabase
    .from('folios')
    .select('total_charges, total_payments')
    .eq('id', folioId)
    .single();

  if (error || !folio) {
    return { valid: false, balance: 0, message: 'Folio not found' };
  }

  const balance = (folio.total_charges || 0) - (folio.total_payments || 0);

  if (paymentAmount > balance + 0.01) {
    return {
      valid: false,
      balance,
      message: `Payment amount (₦${paymentAmount.toFixed(2)}) exceeds outstanding balance (₦${balance.toFixed(2)})`
    };
  }

  return { valid: true, balance };
}

/**
 * Get payment method fee preview (for UI display before payment)
 */
export async function getPaymentMethodFeePreview(
  paymentMethodId: string,
  amount: number
): Promise<{ fee: number; net: number; method: string }> {
  const method = await getPaymentMethodConfig(paymentMethodId);
  const fee = calculatePaymentFee(amount, method);
  const net = amount - fee;

  return {
    fee,
    net,
    method: method.name
  };
}
