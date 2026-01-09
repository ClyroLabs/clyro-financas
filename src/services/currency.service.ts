import { Injectable, computed, signal, OnDestroy, effect, inject } from '@angular/core';
import { TranslationService } from './translation.service';

interface CurrencyInfo {
  locale: string;
  currency: string;
  symbol: string;
}

export type Currency = 'USD' | 'BRL' | 'EUR';
export type CryptoAsset = 'ETH' | 'BNB' | 'USDT' | 'WBTC' | 'BTC';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService implements OnDestroy {
  private translationService = inject(TranslationService);

  // Exchange rates: how much 1 BRL is worth in other currencies
  // BRL is the BASE currency (prices are stored in BRL)
  private fiatRates = signal({
    'BRL': 1.0,      // Base currency
    'USD': 0.183,    // 1 BRL = ~0.183 USD (i.e., 1 USD = ~5.45 BRL)
    'EUR': 0.169     // 1 BRL = ~0.169 EUR (i.e., 1 EUR = ~5.90 BRL)
  });

  private cryptoRatesUSD = signal<Record<CryptoAsset, number>>({
    'ETH': 3500.00,
    'BNB': 600.00,
    'USDT': 1.00,
    'WBTC': 70000.00,
    'BTC': 65000.00
  });

  private updateInterval: any;
  private lastCryptoUpdate = 0;

  // Default to BRL as it's the base currency
  selectedCurrency = signal<Currency>('BRL');

  constructor() {
    // Simulate real-time updates every 15 seconds
    this.updateInterval = setInterval(() => this.fetchAndUpdateRates(), 15000);

    // Sync currency with language changes
    effect(() => {
      const lang = this.translationService.currentLang();
      switch (lang) {
        case 'en':
          this.selectedCurrency.set('USD');
          break;
        case 'pt':
          this.selectedCurrency.set('BRL');
          break;
        case 'es':
          this.selectedCurrency.set('EUR');
          break;
      }
    });
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  setCurrency(currency: Currency) {
    this.selectedCurrency.set(currency);
  }

  private fetchAndUpdateRates() {
    const now = Date.now();
    // Cache for 60 seconds to reduce frequent updates
    if (now - this.lastCryptoUpdate < 60000) {
      return;
    }
    this.lastCryptoUpdate = now;

    // In a real app, this would be an API call.
    // Here, we simulate fluctuations.
    this.fiatRates.update(currentRates => {
      const newRates = { ...currentRates };
      // Keep BRL fixed at 1 as base
      newRates.BRL = 1;
      // Fluctuate USD rate by up to 2%
      newRates.USD = parseFloat((currentRates.USD * (1 + (Math.random() - 0.5) * 0.04)).toFixed(4));
      // Fluctuate EUR rate by up to 2%
      newRates.EUR = parseFloat((currentRates.EUR * (1 + (Math.random() - 0.5) * 0.04)).toFixed(4));
      return newRates;
    });
    this.cryptoRatesUSD.update(currentRates => {
      const newRates = { ...currentRates };
      newRates.ETH = parseFloat((currentRates.ETH * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2));
      newRates.BNB = parseFloat((currentRates.BNB * (1 + (Math.random() - 0.5) * 0.06)).toFixed(2));
      newRates.WBTC = parseFloat((currentRates.WBTC * (1 + (Math.random() - 0.5) * 0.04)).toFixed(2));
      newRates.BTC = parseFloat((currentRates.BTC * (1 + (Math.random() - 0.5) * 0.04)).toFixed(2));
      return newRates;
    });
  }

  currencyInfo = computed<CurrencyInfo>(() => {
    const currency = this.selectedCurrency();
    switch (currency) {
      case 'BRL':
        return { locale: 'pt-BR', currency: 'BRL', symbol: 'R$' };
      case 'EUR':
        return { locale: 'es-ES', currency: 'EUR', symbol: '€' };
      case 'USD':
      default:
        return { locale: 'en-US', currency: 'USD', symbol: '$' };
    }
  });

  /**
   * Convert a value FROM BRL (base currency) TO the selected currency
   */
  convertFromBRL(valueInBRL: number): number {
    const targetCurrency = this.selectedCurrency();
    const currentRates = this.fiatRates();
    const rate = currentRates[targetCurrency] ?? 1;
    return valueInBRL * rate;
  }

  /**
   * Convert a value FROM the selected currency TO BRL
   */
  convertToBRL(valueInSelectedCurrency: number): number {
    const sourceCurrency = this.selectedCurrency();
    const currentRates = this.fiatRates();
    const rate = currentRates[sourceCurrency] ?? 1;
    if (rate === 0) return 0;
    return valueInSelectedCurrency / rate;
  }

  /**
   * Convert a value from BRL to USD specifically
   */
  convertBRLtoUSD(valueInBRL: number): number {
    const currentRates = this.fiatRates();
    return valueInBRL * currentRates.USD;
  }

  /**
   * Legacy convert method - treats input as BRL and converts to selected currency
   */
  convert(valueInBaseCurrency: number): number {
    return this.convertFromBRL(valueInBaseCurrency);
  }

  convertToUsd(valueInCurrentCurrency: number): number {
    const targetCurrency = this.currencyInfo().currency;
    const currentRates = this.fiatRates();
    const currentRate = currentRates[targetCurrency as keyof typeof currentRates] ?? 1;
    const usdRate = currentRates['USD'];

    if (currentRate === 0) return 0;

    // Convert to Base (BRL) then to USD
    const valueInBase = valueInCurrentCurrency / currentRate;
    return valueInBase * usdRate;
  }

  convertFromUsd(valueInUsd: number, toCurrency: Currency): number {
    const rates = this.fiatRates();
    const usdRate = rates['USD'];
    const toRate = rates[toCurrency] ?? 1;

    if (usdRate === 0) return 0;

    // Convert USD to Base (BRL) then to Target
    const valueInBase = valueInUsd / usdRate;
    return valueInBase * toRate;
  }

  convertToUsdFrom(value: number, fromCurrency: Currency): number {
    const rates = this.fiatRates();
    const fromRate = rates[fromCurrency] ?? 1;
    const usdRate = rates['USD'];

    if (fromRate === 0) return 0;

    // Convert From to Base (BRL) then to USD
    const valueInBase = value / fromRate;
    return valueInBase * usdRate;
  }

  getCryptoPriceInUSD(asset: CryptoAsset): number {
    return this.cryptoRatesUSD()[asset];
  }

  format(value: number, options?: { notation?: 'compact' }): string {
    const { locale, currency } = this.currencyInfo();
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
    };
    if (options?.notation === 'compact') {
      formatOptions.notation = 'compact';
      formatOptions.maximumFractionDigits = 1;
    }
    return new Intl.NumberFormat(locale, formatOptions).format(value);
  }

  /**
   * Format a value as BRL (Brazilian Real)
   */
  formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Format a value as USD
   */
  formatUSD(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  /**
   * Format a BRL value with its USD equivalent shown below
   * Returns an object with both formatted strings
   */
  formatWithUSDReference(valueInBRL: number): { primary: string; secondary: string } {
    const usdValue = this.convertBRLtoUSD(valueInBRL);
    return {
      primary: this.formatBRL(valueInBRL),
      secondary: `~ ${this.formatUSD(usdValue)}`
    };
  }
}