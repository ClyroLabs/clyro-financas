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
    basic: { monthly: 10.00, yearly: 98.40 },
    premium: { monthly: 20.00, yearly: 196.80 }
  });

  public readonly prices = this._prices.asReadonly();

  updatePrices(newPrices: Prices) {
    this._prices.set(newPrices);
  }

  getPrice(plan: 'basic' | 'premium', cycle: 'monthly' | 'yearly'): number {
    return this._prices()[plan][cycle];
  }
}
