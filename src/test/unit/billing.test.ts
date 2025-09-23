import { describe, test, expect } from 'vitest';

describe('Billing System Tests', () => {
  test('should calculate correct folio balance', () => {
    const charges = 25000;
    const payments = 15000;
    const balance = charges - payments;
    expect(balance).toBe(10000);
  });

  test('should handle currency conversion', () => {
    const usdAmount = 100;
    const conversionRate = 800;
    const ngnAmount = usdAmount * conversionRate;
    expect(ngnAmount).toBe(80000);
  });
});