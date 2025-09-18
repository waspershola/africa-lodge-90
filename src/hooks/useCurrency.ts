import { useState, createContext, useContext, ReactNode } from "react";

export interface CurrencyTaxSettings {
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  taxes: {
    vatEnabled: boolean;
    vatRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
    cityTaxEnabled: boolean;
    cityTaxAmount: number;
    touristTaxEnabled: boolean;
    touristTaxAmount: number;
  };
  priceDisplay: {
    showTaxInclusive: boolean;
    showTaxBreakdown: boolean;
  };
}

const defaultSettings: CurrencyTaxSettings = {
  currency: {
    code: "USD",
    symbol: "$",
    name: "US Dollar"
  },
  taxes: {
    vatEnabled: false,
    vatRate: 0,
    serviceChargeEnabled: false,
    serviceChargeRate: 0,
    cityTaxEnabled: false,
    cityTaxAmount: 0,
    touristTaxEnabled: false,
    touristTaxAmount: 0,
  },
  priceDisplay: {
    showTaxInclusive: true,
    showTaxBreakdown: false,
  }
};

interface CurrencyContextType {
  settings: CurrencyTaxSettings;
  updateSettings: (settings: CurrencyTaxSettings) => void;
  formatPrice: (amount: number, showCurrency?: boolean) => string;
  calculateTotalPrice: (basePrice: number) => {
    totalPrice: number;
    breakdown: Array<{ type: string; amount: number; label: string }>;
  };
}

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Return default implementation if not in context
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      formatPrice: (amount: number, showCurrency = true) => 
        showCurrency ? `${defaultSettings.currency.symbol}${amount.toFixed(2)}` : amount.toFixed(2),
      calculateTotalPrice: (basePrice: number) => ({
        totalPrice: basePrice,
        breakdown: []
      })
    };
  }
  return context;
}

export function useCurrencyProvider(): CurrencyContextType {
  const [settings, setSettings] = useState<CurrencyTaxSettings>(defaultSettings);

  const updateSettings = (newSettings: CurrencyTaxSettings) => {
    setSettings(newSettings);
  };

  const formatPrice = (amount: number, showCurrency = true) => {
    const formatted = amount.toFixed(2);
    return showCurrency ? `${settings.currency.symbol}${formatted}` : formatted;
  };

  const calculateTotalPrice = (basePrice: number) => {
    let totalPrice = basePrice;
    const breakdown: Array<{ type: string; amount: number; label: string }> = [];

    if (settings.taxes.vatEnabled && settings.taxes.vatRate > 0) {
      const vatAmount = (basePrice * settings.taxes.vatRate) / 100;
      totalPrice += vatAmount;
      breakdown.push({
        type: "vat",
        amount: vatAmount,
        label: `VAT (${settings.taxes.vatRate}%)`
      });
    }

    if (settings.taxes.serviceChargeEnabled && settings.taxes.serviceChargeRate > 0) {
      const serviceAmount = (basePrice * settings.taxes.serviceChargeRate) / 100;
      totalPrice += serviceAmount;
      breakdown.push({
        type: "service",
        amount: serviceAmount,
        label: `Service Charge (${settings.taxes.serviceChargeRate}%)`
      });
    }

    if (settings.taxes.cityTaxEnabled && settings.taxes.cityTaxAmount > 0) {
      totalPrice += settings.taxes.cityTaxAmount;
      breakdown.push({
        type: "cityTax",
        amount: settings.taxes.cityTaxAmount,
        label: "City Tax"
      });
    }

    if (settings.taxes.touristTaxEnabled && settings.taxes.touristTaxAmount > 0) {
      totalPrice += settings.taxes.touristTaxAmount;
      breakdown.push({
        type: "touristTax",
        amount: settings.taxes.touristTaxAmount,
        label: "Tourist Tax"
      });
    }

    return { totalPrice, breakdown };
  };

  return {
    settings,
    updateSettings,
    formatPrice,
    calculateTotalPrice
  };
}