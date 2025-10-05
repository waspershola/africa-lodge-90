import { describe, test, expect } from 'vitest';
import { calculateTaxesAndCharges } from '@/lib/tax-calculator';
import type { HotelConfiguration } from '@/types/configuration';

describe('Tax Calculator - Double Tax Prevention', () => {
  const defaultConfig: HotelConfiguration = {
    tax: {
      vat_rate: 7.5,
      service_charge_rate: 10.0,
      tax_inclusive: false,
      service_charge_inclusive: false,
      vat_applicable_to: ['room', 'food', 'beverage'],
      service_applicable_to: ['room', 'food', 'beverage'],
    }
  } as HotelConfiguration;

  test('should calculate room charges correctly (exclusive mode)', () => {
    const result = calculateTaxesAndCharges({
      baseAmount: 10000,
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: defaultConfig
    });

    expect(result.baseAmount).toBe(10000);
    expect(result.serviceChargeAmount).toBe(1000); // 10% of 10,000
    expect(result.vatAmount).toBe(825); // 7.5% of (10,000 + 1,000)
    expect(result.totalAmount).toBe(11825);
  });

  test('should NOT apply taxes twice on already-taxed amount', () => {
    // First calculation (correct)
    const firstCalc = calculateTaxesAndCharges({
      baseAmount: 10000,
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: defaultConfig
    });

    // This is what was happening before the fix:
    // Using the TOTAL (11,825) as base for second calculation
    const incorrectCalc = calculateTaxesAndCharges({
      baseAmount: firstCalc.totalAmount, // ❌ WRONG: Using total as base
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: defaultConfig
    });

    // The incorrect calculation should give us the double-taxed amount
    expect(incorrectCalc.totalAmount).toBe(13983.06);
    expect(incorrectCalc.totalAmount - firstCalc.totalAmount).toBe(2158.06);

    // The CORRECT approach: Always use base amount
    const correctCalc = calculateTaxesAndCharges({
      baseAmount: 10000, // ✅ CORRECT: Always use base
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: defaultConfig
    });

    expect(correctCalc.totalAmount).toBe(11825);
  });

  test('should handle tax-exempt guests correctly', () => {
    const result = calculateTaxesAndCharges({
      baseAmount: 10000,
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: true, // Tax exempt
      configuration: defaultConfig
    });

    expect(result.baseAmount).toBe(10000);
    expect(result.vatAmount).toBe(0);
    expect(result.serviceChargeAmount).toBe(0);
    expect(result.totalAmount).toBe(10000);
  });

  test('should handle non-taxable charge types', () => {
    const result = calculateTaxesAndCharges({
      baseAmount: 10000,
      chargeType: 'laundry', // Not in vat_applicable_to
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: {
        ...defaultConfig,
        tax: {
          ...defaultConfig.tax,
          vat_applicable_to: ['room', 'food'], // Laundry not included
          service_applicable_to: ['room']  // Laundry not included
        }
      }
    });

    expect(result.baseAmount).toBe(10000);
    expect(result.vatAmount).toBe(0);
    expect(result.serviceChargeAmount).toBe(0);
    expect(result.totalAmount).toBe(10000);
  });

  test('should calculate multiple nights correctly', () => {
    const nights = 3;
    const ratePerNight = 10000;
    const totalBase = ratePerNight * nights;

    const result = calculateTaxesAndCharges({
      baseAmount: totalBase,
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: defaultConfig
    });

    expect(result.baseAmount).toBe(30000);
    expect(result.serviceChargeAmount).toBe(3000);
    expect(result.vatAmount).toBe(2475);
    expect(result.totalAmount).toBe(35475);
  });

  test('should handle inclusive tax mode', () => {
    const inclusiveConfig: HotelConfiguration = {
      ...defaultConfig,
      tax: {
        ...defaultConfig.tax,
        tax_inclusive: true,
        service_charge_inclusive: true
      }
    };

    const result = calculateTaxesAndCharges({
      baseAmount: 11825, // This is the TOTAL in inclusive mode
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: inclusiveConfig
    });

    // In inclusive mode, taxes are extracted from the total
    expect(result.totalAmount).toBe(11825);
    expect(result.baseAmount).toBeLessThan(11825);
    expect(result.vatAmount).toBeGreaterThan(0);
    expect(result.serviceChargeAmount).toBeGreaterThan(0);
    expect(result.baseAmount + result.vatAmount + result.serviceChargeAmount).toBe(11825);
  });
});
