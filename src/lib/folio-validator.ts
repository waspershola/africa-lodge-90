// @ts-nocheck
/**
 * Phase 5: Folio Validation Utilities
 * Ensures calculation consistency across the system
 */

import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  folioId: string;
  discrepancies: ValidationDiscrepancy[];
}

export interface ValidationDiscrepancy {
  field: string;
  expected: number;
  actual: number;
  difference: number;
  severity: 'critical' | 'warning' | 'info';
}

const TOLERANCE = 0.01; // ₦0.01 tolerance for rounding

/**
 * Validate a single folio's calculations
 */
export async function validateFolio(folioId: string): Promise<ValidationResult> {
  const discrepancies: ValidationDiscrepancy[] = [];

  try {
    // Get folio data using the centralized RPC
    const { data, error } = await supabase
      .rpc('get_folio_with_breakdown', { p_folio_id: folioId });

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to fetch folio: ${error?.message || 'Not found'}`);
    }

    const folio = data[0];

    // Calculate expected charges from breakdown
    const expectedCharges = (folio.charges as any[]).reduce(
      (sum, charge) => sum + (charge.amount || 0),
      0
    );

    // Calculate expected payments from breakdown
    const expectedPayments = (folio.payments as any[]).reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    // Calculate expected balance
    const expectedBalance = expectedCharges - expectedPayments;

    // Validate total_charges
    const chargesDiff = Math.abs(folio.total_charges - expectedCharges);
    if (chargesDiff > TOLERANCE) {
      discrepancies.push({
        field: 'total_charges',
        expected: expectedCharges,
        actual: folio.total_charges,
        difference: chargesDiff,
        severity: 'critical',
      });
    }

    // Validate total_payments
    const paymentsDiff = Math.abs(folio.total_payments - expectedPayments);
    if (paymentsDiff > TOLERANCE) {
      discrepancies.push({
        field: 'total_payments',
        expected: expectedPayments,
        actual: folio.total_payments,
        difference: paymentsDiff,
        severity: 'critical',
      });
    }

    // Validate balance
    const balanceDiff = Math.abs(folio.balance - expectedBalance);
    if (balanceDiff > TOLERANCE) {
      discrepancies.push({
        field: 'balance',
        expected: expectedBalance,
        actual: folio.balance,
        difference: balanceDiff,
        severity: 'critical',
      });
    }

    // Validate payment status logic
    const getExpectedPaymentStatus = (balance: number): string => {
      if (Math.abs(balance) < 0.01) return 'paid';
      if (balance < 0) return 'overpaid';
      return 'partial';
    };
    
    const expectedStatus = getExpectedPaymentStatus(folio.balance);
    const actualStatus = folio.status || 'unpaid';
    if (actualStatus !== expectedStatus) {
      discrepancies.push({
        field: 'payment_status',
        expected: 0, // Not a number, but for consistency
        actual: 0,
        difference: 0,
        severity: 'warning',
      });
    }

    return {
      isValid: discrepancies.length === 0,
      folioId,
      discrepancies,
    };
  } catch (error) {
    console.error('[validateFolio] Error:', error);
    throw error;
  }
}

/**
 * Validate multiple folios at once
 */
export async function validateFolios(
  folioIds: string[]
): Promise<ValidationResult[]> {
  const results = await Promise.allSettled(
    folioIds.map((id) => validateFolio(id))
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<ValidationResult>).value);
}

/**
 * Get expected payment status based on balance
 */
function getExpectedPaymentStatus(
  balance: number
): 'paid' | 'partial' | 'unpaid' | 'overpaid' {
  if (balance <= -TOLERANCE) return 'overpaid';
  if (Math.abs(balance) <= TOLERANCE) return 'paid';
  if (balance > TOLERANCE) return 'partial'; // Assuming some payments exist
  return 'unpaid';
}

/**
 * Auto-fix discrepancies by recalculating folio
 */
export async function autoFixFolio(folioId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('recalculate_folio_balance', {
      p_folio_id: folioId,
    });

    if (error) {
      console.error('[autoFixFolio] Error:', error);
      return false;
    }

    return data?.[0]?.was_corrected || false;
  } catch (error) {
    console.error('[autoFixFolio] Error:', error);
    return false;
  }
}
