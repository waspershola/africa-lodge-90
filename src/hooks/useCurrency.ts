import { useState, createContext, useContext, ReactNode } from "react";
import { useConfiguration } from "@/hooks/useConfiguration";

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
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira"
  },
  taxes: {
    vatEnabled: true,
    vatRate: 7.5,
    serviceChargeEnabled: true,
    serviceChargeRate: 10,
    cityTaxEnabled: false,
    cityTaxAmount: 0,
    touristTaxEnabled: false,
    touristTaxAmount: 0,
  },
  priceDisplay: {
    showTaxInclusive: false,
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
  const { configuration } = useConfiguration();
  const context = useContext(CurrencyContext);
  
  if (!context) {
    // Get currency settings from hotel configuration
    const currencyCode = configuration?.currency?.default_currency || "NGN";
    const currencySymbol = configuration?.currency?.currency_symbol || "₦";
    const vatRate = configuration?.tax?.vat_rate || 7.5;
    const serviceChargeRate = configuration?.tax?.service_charge_rate || 10;
    
    const settings: CurrencyTaxSettings = {
      currency: {
        code: currencyCode,
        symbol: currencySymbol,
        name: currencyCode === 'NGN' ? 'Nigerian Naira' : currencyCode === 'USD' ? 'US Dollar' : currencyCode
      },
      taxes: {
        vatEnabled: true,
        vatRate,
        serviceChargeEnabled: true,
        serviceChargeRate,
        cityTaxEnabled: false,
        cityTaxAmount: 0,
        touristTaxEnabled: false,
        touristTaxAmount: 0,
      },
      priceDisplay: {
        showTaxInclusive: configuration?.tax?.tax_inclusive || false,
        showTaxBreakdown: false,
      }
    };
    
    return {
      settings,
      updateSettings: () => {},
      formatPrice: (amount: number, showCurrency = true) => {
        const formattedAmount = amount.toLocaleString('en-NG', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        return showCurrency ? `${currencySymbol}${formattedAmount}` : formattedAmount;
      },
      calculateTotalPrice: (basePrice: number) => {
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

        return { totalPrice, breakdown };
      }
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