import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CurrencyService } from '../../services/currency.service';
import { DynamicCurrencyPipe } from '../../pipes/dynamic-currency.pipe';
import { DynamicDecimalPipe } from '../../pipes/dynamic-decimal.pipe';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';

interface TaxResult {
    taxableIncome: number;
    totalTax: number;
    effectiveRate: number;
    breakdown: { taxableAmount: number, rate: number, tax: number }[];
}

export interface TaxPreset {
  id: string;
  nameKey: string;
  values: {
    income: number; // Stored in USD for consistent conversion
    deductions: number; // Stored in USD for consistent conversion
  };
}

@Component({
  selector: 'app-simple-tax-calculator',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, DynamicCurrencyPipe, DynamicDecimalPipe, CurrencyMaskDirective],
  templateUrl: './simple-tax-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleTaxCalculatorComponent {
  private fb = inject(FormBuilder);
  currencyService = inject(CurrencyService);

  @ViewChild('resultsContainer') set resultsContainer(ref: ElementRef<HTMLDivElement> | undefined) {
    if (ref) {
      setTimeout(() => {
        ref.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
    }
  }

  calculationMode = signal<'progressive' | 'flat'>('progressive');

  taxForm = this.fb.group({
    country: ['usa', Validators.required],
    income: [50000, [Validators.required, Validators.min(0)]],
    deductions: [0, [Validators.required, Validators.min(0)]],
    rate: [10, [Validators.min(0), Validators.max(100)]], // For flat rate mode
  });

  taxResult = signal<TaxResult | null>(null);

  presets = signal({
    usa: [
        { id: 'usa_single', nameKey: 'preset_usa_single', values: { income: 60000, deductions: 14600 } },
        { id: 'usa_avg', nameKey: 'preset_usa_avg_income', values: { income: 74580, deductions: 14600 } }
    ],
    brazil: [
        { id: 'brazil_mei', nameKey: 'preset_brazil_mei', values: { income: 15000, deductions: 0 } },
        { id: 'brazil_clt', nameKey: 'preset_brazil_clt', values: { income: 6500, deductions: 1000 } }
    ],
    spain: [
        { id: 'spain_general', nameKey: 'preset_spain_general', values: { income: 30000, deductions: 2150 } },
        { id: 'spain_avg', nameKey: 'preset_spain_avg_income', values: { income: 32250, deductions: 2150 } }
    ]
  }).asReadonly();

  private usaTaxBrackets = [
    { rate: 0.10, threshold: 11000 },
    { rate: 0.12, threshold: 44725 },
    { rate: 0.22, threshold: 95375 },
    { rate: 0.24, threshold: 182100 },
    { rate: 0.32, threshold: 231250 },
    { rate: 0.35, threshold: 578125 },
    { rate: 0.37, threshold: Infinity },
  ];
  
  private brazilTaxBrackets = [
      { rate: 0, threshold: 4628 }, // R$25200 / 5.45
      { rate: 0.075, threshold: 6222 }, // R$33912 / 5.45
      { rate: 0.15, threshold: 8259 }, // R$45012 / 5.45
      { rate: 0.225, threshold: 10271 }, // R$55980 / 5.45
      { rate: 0.275, threshold: Infinity },
  ];

  private spainTaxBrackets = [
      { rate: 0.19, threshold: 13387 }, // €12,450 / 0.93
      { rate: 0.24, threshold: 21720 }, // €20,200 / 0.93
      { rate: 0.30, threshold: 37849 }, // €35,200 / 0.93
      { rate: 0.37, threshold: 64516 }, // €60,000 / 0.93
      { rate: 0.45, threshold: 322580 },// €300,000 / 0.93
      { rate: 0.47, threshold: Infinity },
  ];
  
  activeBrackets = computed(() => {
    const country = this.taxForm.get('country')?.value;
    switch (country) {
      case 'brazil': return this.brazilTaxBrackets;
      case 'spain': return this.spainTaxBrackets;
      case 'usa': default: return this.usaTaxBrackets;
    }
  });

  constructor() {
    effect(() => {
      const mode = this.calculationMode();
      const rateControl = this.taxForm.get('rate');
      const countryControl = this.taxForm.get('country');
      
      if (mode === 'flat') {
        rateControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        countryControl?.clearValidators();
      } else {
        rateControl?.clearValidators();
        countryControl?.setValidators(Validators.required);
      }
      rateControl?.updateValueAndValidity();
      countryControl?.updateValueAndValidity();
    });
  }

  calculateTax() {
    if (this.taxForm.invalid) {
      return;
    }

    const { income, deductions } = this.taxForm.value;
    const taxableIncome = Math.max(0, (income ?? 0) - (deductions ?? 0));

    if (this.calculationMode() === 'progressive') {
      this.calculateProgressiveTax(taxableIncome);
    } else {
      this.calculateFlatTax(taxableIncome);
    }
  }

  private calculateProgressiveTax(taxableIncome: number) {
    const { country } = this.taxForm.value;
    const taxableIncomeUSD = this.currencyService.convertToUsd(taxableIncome);

    const brackets = country === 'usa' 
        ? this.usaTaxBrackets 
        : country === 'brazil' 
            ? this.brazilTaxBrackets 
            : this.spainTaxBrackets;
    
    let totalTaxUSD = 0;
    let remainingIncome = taxableIncomeUSD;
    let lastThreshold = 0;
    const breakdown: { taxableAmount: number, rate: number, tax: number }[] = [];

    for (const bracket of brackets) {
        if (remainingIncome <= 0) break;

        const taxableInBracket = Math.min(remainingIncome, bracket.threshold - lastThreshold);
        const taxInBracketUSD = taxableInBracket * bracket.rate;
        totalTaxUSD += taxInBracketUSD;

        if (taxableInBracket > 0) {
            breakdown.push({
                taxableAmount: this.currencyService.convert(taxableInBracket),
                rate: bracket.rate,
                tax: this.currencyService.convert(taxInBracketUSD),
            });
        }
        remainingIncome -= taxableInBracket;
        lastThreshold = bracket.threshold;
    }

    const totalTax = this.currencyService.convert(totalTaxUSD);
    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
    
    this.taxResult.set({
        taxableIncome: taxableIncome,
        totalTax: totalTax,
        effectiveRate: effectiveRate,
        breakdown
    });
  }

  private calculateFlatTax(taxableIncome: number) {
    const { rate } = this.taxForm.value;
    const flatRate = (rate ?? 0) / 100;
    const totalTax = taxableIncome * flatRate;
    
    this.taxResult.set({
      taxableIncome: taxableIncome,
      totalTax: totalTax,
      effectiveRate: rate ?? 0,
      breakdown: [
        {
          taxableAmount: taxableIncome,
          rate: flatRate,
          tax: totalTax,
        }
      ]
    });
  }

  applyPreset(preset: TaxPreset) {
      const convertedIncome = this.currencyService.convert(preset.values.income);
      const convertedDeductions = this.currencyService.convert(preset.values.deductions);

      this.taxForm.patchValue({
        income: parseFloat(convertedIncome.toFixed(2)),
        deductions: parseFloat(convertedDeductions.toFixed(2))
      });
      this.calculateTax();
  }
    
  clearForm() {
    this.calculationMode.set('progressive');
    this.taxForm.reset({
        country: 'usa',
        income: 50000,
        deductions: 0,
        rate: 10
    });
    this.taxResult.set(null);
  }
}