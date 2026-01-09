import { Injectable, signal, computed } from '@angular/core';

export interface PlanPricing {
  monthly: number;
  yearly: number;
  yearlyWithoutDiscount: number;
}

export interface Prices {
  basic: PlanPricing;
  premium: PlanPricing;
}

// Discount percentage for annual plans (15%)
const ANNUAL_DISCOUNT_PERCENT = 15;

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  // Base monthly prices
  private readonly basicMonthly = 34.90;
  private readonly premiumMonthly = 59.90;

  // Calculate yearly prices with discount
  private calculateYearlyPrice(monthlyPrice: number): number {
    const fullYearPrice = monthlyPrice * 12;
    const discount = fullYearPrice * (ANNUAL_DISCOUNT_PERCENT / 100);
    return Math.round((fullYearPrice - discount) * 100) / 100; // Round to 2 decimal places
  }

  private _prices = signal<Prices>({
    basic: {
      monthly: this.basicMonthly,
      yearly: this.calculateYearlyPrice(this.basicMonthly),
      yearlyWithoutDiscount: this.basicMonthly * 12
    },
    premium: {
      monthly: this.premiumMonthly,
      yearly: this.calculateYearlyPrice(this.premiumMonthly),
      yearlyWithoutDiscount: this.premiumMonthly * 12
    }
  });

  public readonly prices = this._prices.asReadonly();
  public readonly annualDiscountPercent = ANNUAL_DISCOUNT_PERCENT;

  // Get savings amount for annual plan
  getAnnualSavings(plan: 'basic' | 'premium'): number {
    const prices = this._prices()[plan];
    return Math.round((prices.yearlyWithoutDiscount - prices.yearly) * 100) / 100;
  }

  // Get monthly equivalent when paying annually
  getMonthlyEquivalent(plan: 'basic' | 'premium'): number {
    return Math.round((this._prices()[plan].yearly / 12) * 100) / 100;
  }

  updatePrices(basicMonthly: number, premiumMonthly: number) {
    this._prices.set({
      basic: {
        monthly: basicMonthly,
        yearly: this.calculateYearlyPrice(basicMonthly),
        yearlyWithoutDiscount: basicMonthly * 12
      },
      premium: {
        monthly: premiumMonthly,
        yearly: this.calculateYearlyPrice(premiumMonthly),
        yearlyWithoutDiscount: premiumMonthly * 12
      }
    });
  }

  getPrice(plan: 'basic' | 'premium', cycle: 'monthly' | 'yearly'): number {
    return this._prices()[plan][cycle];
  }
}
