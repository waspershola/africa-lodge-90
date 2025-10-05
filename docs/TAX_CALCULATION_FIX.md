# Tax Calculation Fix: Double Tax Prevention

## Problem Summary

When rooms were assigned using `useHardAssignReservation`, the system was applying taxes **twice** on the same amount, resulting in incorrect folio balances and overcharges to guests.

### Example of the Issue

**Expected Calculation:**
```
Base Amount:     ₦10,000.00
Service (10%):   ₦1,000.00
VAT (7.5%):      ₦825.00    (on base + service = ₦11,000)
─────────────────────────
Total:           ₦11,825.00
```

**Actual (Incorrect) Calculation:**
```
Base Amount:     ₦11,825.00  ❌ (using total as base)
Service (10%):   ₦1,182.50
VAT (7.5%):      ₦975.56     (on ₦11,825 + ₦1,182.50)
─────────────────────────
Total:           ₦13,983.06  ❌ (₦2,158.06 overcharge!)
```

## Root Cause

In `src/hooks/useAfricanReservationSystem.ts`, the `useHardAssignReservation` function was:

1. Calculating `totalAmount = room_rate * nights` (which already included taxes)
2. Inserting this total as the `amount` field in `folio_charges`
3. The database was then recalculating taxes on this already-taxed amount

```typescript
// ❌ BEFORE (Incorrect)
const totalAmount = reservation.room_rate * nights;
await supabase.from('folio_charges').insert({
  amount: totalAmount,  // This already includes taxes!
  // No base_amount, vat_amount, service_charge_amount specified
});
```

## Solution

### 1. Use Centralized Tax Calculator

Modified `useHardAssignReservation` to use the `calculateTaxesAndCharges()` function from `@/lib/tax-calculator`, which:

- Properly separates base amount from tax amounts
- Respects hotel settings (tax rates, inclusive/exclusive mode)
- Handles guest tax exemptions
- Prevents double taxation

```typescript
// ✅ AFTER (Correct)
const baseAmount = reservation.room_rate * nights;

const taxCalculation = calculateTaxesAndCharges({
  baseAmount,
  chargeType: 'room',
  isTaxable: true,
  isServiceChargeable: true,
  guestTaxExempt: guest?.tax_exempt || false,
  configuration: { /* hotel settings */ }
});

await supabase.from('folio_charges').insert({
  amount: taxCalculation.totalAmount,
  base_amount: taxCalculation.baseAmount,
  vat_amount: taxCalculation.vatAmount,
  service_charge_amount: taxCalculation.serviceChargeAmount,
  is_taxable: !guest?.tax_exempt,
  is_service_chargeable: !guest?.tax_exempt,
});
```

### 2. Reserved Room Display Fix

Fixed `RoomActionDrawer.tsx` to show payment history tabs for reserved rooms:

```typescript
// ✅ Include confirmed and hard_assigned statuses
const { data: reservation } = await supabase
  .from('reservations')
  .select('id')
  .eq('room_id', room.id)
  .in('status', ['checked_in', 'confirmed', 'hard_assigned'])
  .maybeSingle();
```

### 3. Improved Duplicate Payment Detection

Reduced duplicate detection window from 10 seconds to 5 seconds and added more specific checks:

```typescript
// ✅ More intelligent duplicate detection
const { data: recentPayments } = await supabase
  .from('payments')
  .eq('folio_id', folioId)
  .eq('payment_method_id', paymentData.payment_method_id)
  .eq('processed_by', userId)
  .gte('created_at', fiveSecondsAgo)
  .eq('status', 'completed');

// Allow payments if amount differs by more than ₦0.01
const isDuplicate = recentPayments.some(p => 
  Math.abs(p.amount - paymentData.amount) < 0.01
);
```

## Database Cleanup

For existing incorrect charges in the database, use the cleanup script:

```typescript
import { printDoubleTaxReport, fixDoubleTaxCharges } from '@/scripts/fix-double-tax-charges';

// 1. Review charges that need fixing
await printDoubleTaxReport('your-tenant-id');

// 2. Apply fixes (after review)
await fixDoubleTaxCharges('your-tenant-id');

// 3. Recalculate folio balances
// Use the recalculate_folio_balance() database function for each affected folio
```

## Testing

Run the test suite to verify correct calculations:

```bash
npm run test src/test/unit/tax-calculator.test.ts
```

### Test Coverage

- ✅ Correct exclusive mode calculation (base + service + VAT)
- ✅ Prevention of double taxation
- ✅ Tax-exempt guest handling
- ✅ Non-taxable charge types
- ✅ Multiple-night calculations
- ✅ Inclusive tax mode extraction

## Affected Rooms (Example Data)

Based on the database snapshot:

| Room | Status | Current Balance | Expected Balance | Overcharge |
|------|--------|----------------|------------------|------------|
| 103  | Reserved | ₦6,474.19 | ₦0.00 | ₦6,474.19 |
| 111  | Reserved | ₦4,316.13 | ₦0.00 | ₦4,316.13 |
| 112  | Reserved | ₦4,316.13 | ₦0.00 | ₦4,316.13 |
| 113  | Reserved | ₦2,158.06 | ₦0.00 | ₦2,158.06 |
| 131  | Reserved | ₦6,474.19 | ₦0.00 | ₦6,474.19 |

**Total Overcharge:** ₦23,738.70

## Implementation Files

### Modified Files:
1. `src/hooks/useAfricanReservationSystem.ts` - Fixed room assignment tax calculation
2. `src/hooks/useBilling.ts` - Improved duplicate payment detection
3. `src/hooks/useCheckout.ts` - Improved duplicate payment detection
4. `src/components/frontdesk/RoomActionDrawer.tsx` - Fixed reserved room display

### New Files:
1. `src/scripts/fix-double-tax-charges.ts` - Database cleanup utility
2. `src/test/unit/tax-calculator.test.ts` - Comprehensive test suite
3. `docs/TAX_CALCULATION_FIX.md` - This documentation

## Rollback Plan

If issues occur after deployment:

```sql
-- Rollback changes to specific charge
UPDATE folio_charges
SET 
  amount = [old_amount],
  base_amount = NULL,
  vat_amount = NULL,
  service_charge_amount = NULL
WHERE id = '[charge_id]';

-- Recalculate folio balance
SELECT recalculate_folio_balance('[folio_id]');
```

## Future Improvements

1. **Idempotency Keys:** Implement client-side idempotency keys for true duplicate prevention
2. **Audit Trail:** Add detailed logging for all tax calculations
3. **Tax Rule Engine:** Create a more flexible tax rule system for complex scenarios
4. **Automated Testing:** Add integration tests for the full room assignment flow

## References

- Tax Calculator: `src/lib/tax-calculator.ts`
- Billing Hook: `src/hooks/useBilling.ts`
- Reservation System: `src/hooks/useAfricanReservationSystem.ts`
- Configuration Types: `src/types/configuration.ts`
