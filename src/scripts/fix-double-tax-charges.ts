/**
 * Database Cleanup Script: Fix Double Tax Charges
 * 
 * This script identifies and corrects folio charges that have been incorrectly
 * calculated due to applying taxes on top of already-taxed amounts.
 * 
 * PROBLEM: When room assignment was done, the total amount (including taxes)
 * was inserted as the base amount, causing the database to recalculate taxes
 * on top of the already-taxed amount.
 * 
 * EXAMPLE:
 * - Expected: ₦10,000 base + ₦825 VAT + ₦1,000 service = ₦11,825 total
 * - Actual: ₦11,825 base + ₦975.56 VAT + ₦1,182.50 service = ₦13,983.06 total
 * - Difference: ₦2,158.06 overcharge
 * 
 * HOW TO RUN:
 * This is a diagnostic script. Review the output before making changes.
 * Uncomment the UPDATE section to apply fixes.
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateTaxesAndCharges } from '@/lib/tax-calculator';

interface ChargeToFix {
  id: string;
  folio_id: string;
  tenant_id: string;
  charge_type: string;
  description: string;
  current_amount: number;
  current_base_amount: number | null;
  current_vat_amount: number | null;
  current_service_charge_amount: number | null;
  calculated_base_amount: number;
  calculated_vat_amount: number;
  calculated_service_charge_amount: number;
  calculated_total_amount: number;
  difference: number;
}

export async function scanForDoubleTaxCharges(tenantId: string): Promise<ChargeToFix[]> {
  console.log('🔍 Scanning for double-taxed charges...');
  
  // Get hotel settings for this tenant
  const { data: hotelSettings, error: settingsError } = await supabase
    .from('hotel_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (settingsError) {
    console.error('❌ Failed to fetch hotel settings:', settingsError);
    return [];
  }

  // Get all folio charges for this tenant
  const { data: charges, error: chargesError } = await supabase
    .from('folio_charges')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('charge_type', 'room')
    .order('created_at', { ascending: false });

  if (chargesError) {
    console.error('❌ Failed to fetch charges:', chargesError);
    return [];
  }

  const chargesToFix: ChargeToFix[] = [];

  for (const charge of charges || []) {
    // Skip if base_amount is already set correctly
    if (charge.base_amount && charge.vat_amount !== null && charge.service_charge_amount !== null) {
      continue;
    }

    // Calculate what the charge SHOULD be based on the description
    // Extract nights from description: "Room charges for X night(s)"
    const nightsMatch = charge.description.match(/(\d+) night\(s\)/);
    if (!nightsMatch) continue;

    const nights = parseInt(nightsMatch[1]);
    
    // Try to reverse-engineer the base amount
    // If tax_inclusive = false (most common):
    // total = base + (base * vat_rate / 100) + (base * service_rate / 100)
    // total = base * (1 + vat_rate/100 + service_rate/100)
    // base = total / (1 + vat_rate/100 + service_rate/100)
    
    const vatRate = hotelSettings.tax_rate || 7.5;
    const serviceRate = hotelSettings.service_charge_rate || 10;
    const taxInclusive = hotelSettings.tax_inclusive || false;
    const serviceInclusive = hotelSettings.service_charge_inclusive || false;

    // Calculate expected base amount
    let expectedBaseAmount: number;
    
    if (!taxInclusive && !serviceInclusive) {
      // EXCLUSIVE MODE: total = base + vat + service
      // vat = (base + service) * vatRate / 100
      // service = base * serviceRate / 100
      // So: total = base + base * serviceRate/100 + (base + base * serviceRate/100) * vatRate/100
      // Solving for base:
      const serviceFactor = 1 + serviceRate / 100;
      const vatFactor = serviceFactor * vatRate / 100;
      expectedBaseAmount = charge.amount / (serviceFactor + vatFactor);
    } else {
      // For inclusive modes, assume the current amount is correct and extract base
      expectedBaseAmount = charge.amount / (1 + vatRate / 100 + serviceRate / 100);
    }

    // Round to nearest common room rate (assumes rates are multiples of 1000)
    const roomRatePerNight = Math.round(expectedBaseAmount / nights / 1000) * 1000;
    const calculatedBaseAmount = roomRatePerNight * nights;

    // Recalculate taxes using the correct base
    const configuration = {
      general: { hotel_name: '', address: { street: '', city: '', state: '', country: '', postal_code: '' }, contact: { phone: '', email: '' }, timezone: 'UTC', date_format: 'DD/MM/YYYY' as const, time_format: '24h' as const },
      currency: { default_currency: 'NGN', currency_symbol: '₦', symbol_position: 'before' as const, decimal_places: 2, thousand_separator: ',' as const, decimal_separator: '.' as const },
      branding: { primary_color: '', secondary_color: '', accent_color: '', receipt_header_text: '', receipt_footer_text: '', font_style: 'giveny' as const },
      documents: { default_receipt_template: 'A4' as const, invoice_prefix: '', receipt_prefix: '', digital_signature_enabled: false, include_qr_code: false },
      guest_experience: { checkin_slip_fields: { guest_id_required: false, phone_required: false, email_required: false, address_required: false }, qr_defaults: { include_logo: false, include_hotel_name: false, qr_size: 'medium' as const, default_services: [] }, print_settings: { auto_print_checkin: false, print_on_checkout: false, default_printer: null, include_qr_on_slip: false } },
      permissions: { pricing_changes_require_approval: false, discount_approval_threshold: 0, refund_approval_threshold: 0, service_price_edits_require_approval: false, manager_can_override_rates: false },
      tax: {
        vat_rate: vatRate,
        service_charge_rate: serviceRate,
        tax_inclusive: taxInclusive,
        service_charge_inclusive: serviceInclusive,
        vat_applicable_to: hotelSettings.vat_applicable_to || ['room'],
        service_applicable_to: hotelSettings.service_applicable_to || ['room'],
      }
    };
    
    const taxCalculation = calculateTaxesAndCharges({
      baseAmount: calculatedBaseAmount,
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration
    });

    // Check if there's a significant difference
    const difference = Math.abs(charge.amount - taxCalculation.totalAmount);
    
    if (difference > 100) { // Only flag differences > ₦100
      chargesToFix.push({
        id: charge.id,
        folio_id: charge.folio_id,
        tenant_id: charge.tenant_id,
        charge_type: charge.charge_type,
        description: charge.description,
        current_amount: charge.amount,
        current_base_amount: charge.base_amount,
        current_vat_amount: charge.vat_amount,
        current_service_charge_amount: charge.service_charge_amount,
        calculated_base_amount: taxCalculation.baseAmount,
        calculated_vat_amount: taxCalculation.vatAmount,
        calculated_service_charge_amount: taxCalculation.serviceChargeAmount,
        calculated_total_amount: taxCalculation.totalAmount,
        difference
      });
    }
  }

  return chargesToFix;
}

export async function printDoubleTaxReport(tenantId: string) {
  const chargesToFix = await scanForDoubleTaxCharges(tenantId);

  console.log('\n📊 DOUBLE TAX CHARGE REPORT');
  console.log('============================\n');

  if (chargesToFix.length === 0) {
    console.log('✅ No double-taxed charges found!');
    return;
  }

  console.log(`Found ${chargesToFix.length} charge(s) with incorrect calculations:\n`);

  let totalOvercharge = 0;

  chargesToFix.forEach((charge, index) => {
    console.log(`${index + 1}. Folio: ${charge.folio_id}`);
    console.log(`   Description: ${charge.description}`);
    console.log(`   Current Amount: ₦${charge.current_amount.toLocaleString()}`);
    console.log(`   Correct Amount: ₦${charge.calculated_total_amount.toLocaleString()}`);
    console.log(`   Overcharge: ₦${charge.difference.toLocaleString()}`);
    console.log(`   Breakdown:`);
    console.log(`     - Base: ₦${charge.calculated_base_amount.toLocaleString()}`);
    console.log(`     - VAT: ₦${charge.calculated_vat_amount.toLocaleString()}`);
    console.log(`     - Service: ₦${charge.calculated_service_charge_amount.toLocaleString()}`);
    console.log('');

    totalOvercharge += charge.difference;
  });

  console.log(`Total Overcharge: ₦${totalOvercharge.toLocaleString()}`);
  console.log('\n⚠️  To apply fixes, uncomment the fixDoubleTaxCharges() function call.');
}

export async function fixDoubleTaxCharges(tenantId: string) {
  const chargesToFix = await scanForDoubleTaxCharges(tenantId);

  if (chargesToFix.length === 0) {
    console.log('✅ No charges to fix');
    return;
  }

  console.log(`\n🔧 Fixing ${chargesToFix.length} charge(s)...`);

  for (const charge of chargesToFix) {
    const { error } = await supabase
      .from('folio_charges')
      .update({
        amount: charge.calculated_total_amount,
        base_amount: charge.calculated_base_amount,
        vat_amount: charge.calculated_vat_amount,
        service_charge_amount: charge.calculated_service_charge_amount
      })
      .eq('id', charge.id);

    if (error) {
      console.error(`❌ Failed to fix charge ${charge.id}:`, error);
    } else {
      console.log(`✅ Fixed charge ${charge.id}: ₦${charge.current_amount} → ₦${charge.calculated_total_amount}`);
    }
  }

  console.log('\n✅ All charges fixed!');
  console.log('⚠️  Run recalculate_folio_balance() for each affected folio to update totals.');
}

// Example usage:
// printDoubleTaxReport('your-tenant-id');
// fixDoubleTaxCharges('your-tenant-id');
