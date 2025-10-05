# Payment History & Breakdown Feature

## Overview
Complete payment history and transaction timeline feature integrated into the checkout process. Provides full transparency of all payments and charges with detailed tracking.

## Components

### 1. PaymentHistorySection
**Location:** `src/components/frontdesk/PaymentHistorySection.tsx`

**Features:**
- Displays all payments in chronological order (most recent first)
- Shows payment method, amount, status, and verification status
- Includes processor name, department, and terminal tracking
- Payment reference numbers for reconciliation
- Total paid summary at the top
- Visual status indicators (completed, pending, failed)
- Empty state when no payments exist

**Data Displayed:**
- Date & time of payment
- Payment method (cash, card, bank transfer, etc.)
- Amount paid
- Processing fees (if any)
- Processed by (staff member)
- Department & Terminal location
- Verification status
- Reference number

### 2. ChargeTimelineSection
**Location:** `src/components/frontdesk/ChargeTimelineSection.tsx`

**Features:**
- Combined timeline of all charges and payments
- Visual timeline with color-coded icons
- Running balance calculation after each transaction
- Chronological ordering (most recent first)
- Charges shown in blue, payments in green
- Status badges for pending transactions
- Current balance display at the top

**Timeline Items:**
- Charges: Room, F&B, services, etc.
- Payments: All payment transactions
- Running balance after each item
- Transaction type badges
- Timestamp for each entry

### 3. Updated CheckoutDialog
**Location:** `src/components/frontdesk/CheckoutDialog.tsx`

**New Tabbed Interface:**
1. **Summary Tab** (default)
   - Billing overview with totals
   - Tax breakdown
   - Payment status

2. **Payment History Tab**
   - Complete payment history component
   - All payment details and tracking

3. **Timeline Tab**
   - Chronological transaction timeline
   - Combined charges and payments
   - Running balance visualization

## Hooks

### usePaymentHistory
**Location:** `src/hooks/data/usePaymentHistory.ts`

**Fetches:**
- All payments for a specific folio
- Joins with users table for processor name
- Joins with departments and terminals for tracking
- Includes verification and fee details
- Sorted by creation date (descending)

**Returns:**
```typescript
interface PaymentHistoryItem {
  id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  processed_by: string | null;
  processor_name: string | null;
  department_name: string | null;
  terminal_name: string | null;
  is_verified: boolean;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
}
```

## User Benefits

### For Front Desk Staff:
- Quick verification of payment status
- Complete payment audit trail
- Easy identification of partial payments
- Clear view of remaining balance
- Tracking of who processed payments

### For Guests:
- Transparent billing breakdown
- Clear payment history
- Verification of all transactions
- Easy identification of charges

### For Management:
- Payment accountability (processor tracking)
- Department/terminal attribution
- Verification status monitoring
- Complete transaction audit trail

## Usage Examples

### Checkout Process:
1. Open checkout dialog for occupied room
2. View Summary tab for quick overview
3. Switch to Payment History tab to see all payments
4. Switch to Timeline tab for chronological view
5. Process final payments if needed
6. Complete checkout when balance is zero

### Payment Verification:
1. Check Payment History tab
2. Look for "Verified" badges
3. See department and terminal used
4. Verify processor name
5. Check payment reference numbers

## Testing Scenarios

✅ **Fully Paid Guest**
- Status badge shows "Fully Paid"
- Payment history shows all payments
- Timeline reflects zero balance
- Checkout button enabled

✅ **Partial Payment Guest**
- Status badge shows "Partial Payment"
- Payment history shows payments made
- Timeline shows remaining balance
- Outstanding amount highlighted

✅ **Unpaid Guest**
- Status badge shows "Unpaid"
- Payment history empty or shows failed payments
- Timeline shows full charge amount
- Checkout blocked until payment

✅ **Multiple Payments**
- All payments listed in history
- Timeline shows each payment
- Running balance calculated correctly
- Latest payment shown first

✅ **Department/Terminal Tracking**
- Payment history shows location
- Processor name displayed
- Terminal information visible
- Verification status shown

## Integration Points

### Database Tables Used:
- `payments` - Payment records
- `folios` - Folio data
- `folio_charges` - Charge details
- `users` - Processor information
- `departments` - Department tracking
- `terminals` - Terminal tracking

### Related Features:
- Atomic Checkout (Phase 3)
- Payment Processing (Phase 2)
- Department/Terminal Tracking (Phase 3)
- Payment Verification (Phase 2)
- Tax Calculation System

## Performance Considerations

- Uses React Query for efficient caching
- Parallel data fetching for multiple sources
- Loading skeletons for better UX
- Optimized re-renders with proper memoization
- Automatic refetch after payment success

## Future Enhancements

- Export payment history to PDF
- Email payment receipts
- Payment dispute management
- Payment method analytics
- Real-time payment notifications
- Multi-currency support in history

## Related Documentation

- [Phase 2: Payment Schema Upgrade](./PHASE2_PAYMENT_SCHEMA_COMPLETE.md)
- [Phase 3: Frontend Integration](./PHASE3_FRONTEND_INTEGRATION.md)
- [All Phases Complete Report](./ALL_PHASES_COMPLETE_REPORT.md)
