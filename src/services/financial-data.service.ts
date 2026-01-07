import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { TranslationService } from './translation.service';

export interface FinancialInputs {
  fixedRevenue: number | null;
  sporadicRevenue: number | null;
  fixedExpenses: number | null;
  unforeseenExpenses: number | null;
  personalSpending: number | null;
  productCost: number | null;
  salePrice: number | null;
}

export interface FinancialAnalysis {
    netBalance: number;
    productMargin: number | null;
    totalRevenue: number;
    totalExpenses: number;
    inflationAdjustment: number | null;
}

interface StoredFinancialData {
  timestamp: number;
  data: FinancialInputs;
}

const DEFAULT_DATA: FinancialInputs = {
    fixedRevenue: null,
    sporadicRevenue: null,
    fixedExpenses: null,
    unforeseenExpenses: null,
    personalSpending: null,
    productCost: null,
    salePrice: null,
};

// Source: Approximate annual rates for early 2024, divided by 12.
// These simulate fetching live data for different regions.
const REALISTIC_MONTHLY_INFLATION_RATES = {
  en: 0.035 / 12, // ~3.5% annually for USA
  pt: 0.039 / 12, // ~3.9% annually for Brazil
  es: 0.033 / 12, // ~3.3% annually for Spain
};


@Injectable({
  providedIn: 'root'
})
export class FinancialDataService {
  private readonly DATA_KEY = 'clyro-financial-data';
  private translationService = inject(TranslationService);
  
  financialData = signal<FinancialInputs>(DEFAULT_DATA);
  private monthlyInflationRate = signal<number>(REALISTIC_MONTHLY_INFLATION_RATES.pt);

  analysis = computed<FinancialAnalysis | null>(() => {
    const data = this.financialData();
    const inflationRate = this.monthlyInflationRate();
    
    const totalRevenue = (data.fixedRevenue ?? 0) + (data.sporadicRevenue ?? 0);
    const totalExpenses = (data.fixedExpenses ?? 0) + (data.unforeseenExpenses ?? 0) + (data.personalSpending ?? 0);

    const netBalance = totalRevenue - totalExpenses;

    let productMargin: number | null = null;
    if (data.salePrice && data.productCost && data.salePrice > 0) {
        productMargin = ((data.salePrice - data.productCost) / data.salePrice);
    }

    let inflationAdjustment: number | null = null;
    if (data.salePrice && data.productCost && data.salePrice > 0) {
      const currentMargin = (data.salePrice - data.productCost) / data.salePrice;
      if (currentMargin < 1) { // Avoid division by zero if margin is 100% or more
        const inflatedCost = data.productCost * (1 + inflationRate);
        const newSalePrice = inflatedCost / (1 - currentMargin);
        inflationAdjustment = newSalePrice > data.salePrice ? newSalePrice - data.salePrice : 0;
      }
    }

    return { netBalance, productMargin, totalRevenue, totalExpenses, inflationAdjustment };
  });

  constructor() {
    this.loadData();
    
    // Effect to update inflation rate when language changes, simulating a live data fetch
    effect(() => {
      const lang = this.translationService.currentLang();
      const rate = REALISTIC_MONTHLY_INFLATION_RATES[lang] ?? REALISTIC_MONTHLY_INFLATION_RATES.en;
      this.monthlyInflationRate.set(rate);
    });
  }

  private loadData() {
    try {
      const dataJson = localStorage.getItem(this.DATA_KEY);
      if (dataJson) {
        const storedData: StoredFinancialData = JSON.parse(dataJson);
        const savedDate = new Date(storedData.timestamp);
        const now = new Date();
        // Check if data is from a previous month
        if (savedDate.getFullYear() === now.getFullYear() && savedDate.getMonth() === now.getMonth()) {
          this.financialData.set(storedData.data);
        } else {
          // Data is stale, reset to default for the new month
          this.financialData.set(DEFAULT_DATA);
          localStorage.removeItem(this.DATA_KEY);
        }
      } else {
        this.financialData.set(DEFAULT_DATA);
      }
    } catch (error) {
        console.error('Failed to parse financial data from localStorage', error);
        this.financialData.set(DEFAULT_DATA);
    }
  }

  saveData(data: FinancialInputs) {
    const dataToStore: StoredFinancialData = {
        timestamp: Date.now(),
        data: data
    };
    this.financialData.set(data);
    localStorage.setItem(this.DATA_KEY, JSON.stringify(dataToStore));
  }
}
