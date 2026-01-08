import { Injectable, signal } from '@angular/core';

export interface Prices {
  basic: { monthly: number; yearly: number };
  premium: { monthly: number; yearly: number };
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private _prices = signal<Prices>({
    basic: { monthly: 29.90, yearly: 299.00 },
    premium: { monthly: 59.90, yearly: 599.00 }
  });

  public readonly prices = this._prices.asReadonly();

  updatePrices(newPrices: Prices) {
    this._prices.set(newPrices);
  }

  getPrice(plan: 'basic' | 'premium', cycle: 'monthly' | 'yearly'): number {
    return this._prices()[plan][cycle];
  }
}
