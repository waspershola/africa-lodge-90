import { HotelConfiguration } from "@/types/configuration";

export interface TaxCalculationInput {
  baseAmount: number;
  chargeType: string;
  isTaxable?: boolean;
  isServiceChargeable?: boolean;
  guestTaxExempt?: boolean;
  configuration: HotelConfiguration;
}

export interface TaxBreakdownItem {
  type: 'base' | 'vat' | 'service';
  label: string;
  amount: number;
  rate?: number;
}

export interface TaxCalculationResult {
  baseAmount: number;
  vatAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  breakdown: TaxBreakdownItem[];
}

/**
 * Centralized tax and service charge calculation function
 * Follows professional PMS standards for VAT and Service Charge handling
 */
export function calculateTaxesAndCharges(input: TaxCalculationInput): TaxCalculationResult {
  const {
    baseAmount,
    chargeType,
    isTaxable = true,
    isServiceChargeable = true,
    guestTaxExempt = false,
    configuration
  } = input;

  console.log('🔍 [TAX CALC] Input received:', {
    baseAmount,
    chargeType,
    isTaxable,
    isServiceChargeable,
    guestTaxExempt,
    vat_rate: configuration.tax?.vat_rate,
    service_rate: configuration.tax?.service_charge_rate
  });

  // Get rates from configuration
  const vatRate = configuration.tax?.vat_rate || 7.5;
  const serviceRate = configuration.tax?.service_charge_rate || 10.0;
  const taxInclusive = configuration.tax?.tax_inclusive || false;
  const serviceInclusive = configuration.tax?.service_charge_inclusive || false;
  
  // Get applicability arrays (default to all types if not set)
  const vatApplicableTo = configuration.tax?.vat_applicable_to || 
    ['room', 'food', 'beverage', 'laundry', 'spa'];
  const serviceApplicableTo = configuration.tax?.service_applicable_to || 
    ['room', 'food', 'beverage', 'spa'];

  // Guest tax exemption overrides everything
  if (guestTaxExempt) {
    return {
      baseAmount,
      vatAmount: 0,
      serviceChargeAmount: 0,
      totalAmount: baseAmount,
      breakdown: [
        { type: 'base', label: 'Base Amount', amount: baseAmount }
      ]
    };
  }

  let calculatedBase = baseAmount;
  let calculatedVat = 0;
  let calculatedService = 0;

  // Check if VAT is applicable for this charge type
  const shouldApplyVat = isTaxable && vatApplicableTo.includes(chargeType) && vatRate > 0;
  
  // Check if Service Charge is applicable for this charge type
  const shouldApplyService = isServiceChargeable && serviceApplicableTo.includes(chargeType) && serviceRate > 0;

  if (taxInclusive || serviceInclusive) {
    // INCLUSIVE MODE: Extract embedded taxes from the total
    
    if (taxInclusive && shouldApplyVat) {
      // Extract VAT: base = amount / (1 + rate/100)
      calculatedBase = baseAmount / (1 + vatRate / 100);
      calculatedVat = baseAmount - calculatedBase;
    }

    if (serviceInclusive && shouldApplyService) {
      if (taxInclusive && shouldApplyVat) {
        // Both inclusive: extract service from remaining base after VAT
        calculatedBase = calculatedBase / (1 + serviceRate / 100);
        calculatedService = (baseAmount - calculatedVat) - calculatedBase;
      } else {
        // Only service inclusive
        calculatedBase = baseAmount / (1 + serviceRate / 100);
        calculatedService = baseAmount - calculatedBase;
      }
    }
  } else {
    // EXCLUSIVE MODE: Add taxes on top of base amount
    
    // PHASE 4 FIX: Service charge applied to base
    if (shouldApplyService) {
      calculatedService = calculatedBase * serviceRate / 100;
    }

    // CRITICAL FIX: VAT applies to (base + service), not just base
    if (shouldApplyVat) {
      const taxableAmount = calculatedBase + calculatedService;
      calculatedVat = taxableAmount * vatRate / 100;
    }
  }

  const totalAmount = calculatedBase + calculatedVat + calculatedService;

  // Build breakdown array
  const breakdown: TaxBreakdownItem[] = [
    { 
      type: 'base', 
      label: 'Base Amount', 
      amount: Number(calculatedBase.toFixed(2)) 
    }
  ];

  if (calculatedVat > 0) {
    breakdown.push({
      type: 'vat',
      label: `VAT (${vatRate}%)`,
      amount: Number(calculatedVat.toFixed(2)),
      rate: vatRate
    });
  }

  if (calculatedService > 0) {
    breakdown.push({
      type: 'service',
      label: `Service Charge (${serviceRate}%)`,
      amount: Number(calculatedService.toFixed(2)),
      rate: serviceRate
    });
  }

  const result = {
    baseAmount: Number(calculatedBase.toFixed(2)),
    vatAmount: Number(calculatedVat.toFixed(2)),
    serviceChargeAmount: Number(calculatedService.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    breakdown
  };

  console.log('🔍 [TAX CALC] Result:', result);

  return result;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const symbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
