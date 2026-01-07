import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FinancialDataService, FinancialAnalysis, FinancialInputs } from '../../services/financial-data.service';
import { ToastService } from '../../services/toast.service';
import { TranslationService } from '../../services/translation.service';
import { ExportService } from '../../services/pdf-export.service';
import { CurrencyService } from '../../services/currency.service';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';

@Component({
  selector: 'app-financial-input',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, CurrencyPipe, DecimalPipe, CurrencyMaskDirective],
  templateUrl: './financial-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialInputComponent implements OnInit {
  private fb = inject(FormBuilder);
  private financialDataService = inject(FinancialDataService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);
  private currencyService = inject(CurrencyService);

  financialData = this.financialDataService.financialData;
  analysis = this.financialDataService.analysis;
  showExportMenu = signal(false);

  financialForm = this.fb.group({
    fixedRevenue: [null as number | null],
    sporadicRevenue: [null as number | null],
    fixedExpenses: [null as number | null],
    unforeseenExpenses: [null as number | null],
    personalSpending: [null as number | null],
    productCost: [null as number | null],
    salePrice: [null as number | null],
  });

  analysisInBRL = computed(() => {
    const analysisData = this.analysis();
    if (!analysisData) return null;
    return {
        netBalance: this.currencyService.convertFromUsd(analysisData.netBalance, 'BRL'),
        productMargin: analysisData.productMargin,
        totalRevenue: this.currencyService.convertFromUsd(analysisData.totalRevenue, 'BRL'),
        totalExpenses: this.currencyService.convertFromUsd(analysisData.totalExpenses, 'BRL'),
        inflationAdjustment: analysisData.inflationAdjustment !== null ? this.currencyService.convertFromUsd(analysisData.inflationAdjustment, 'BRL') : null,
    };
  });

  constructor() {
  }

  ngOnInit() {
    const dataInUsd = this.financialData();
    const dataInBrl = this.convertDataForDisplay(dataInUsd);
    this.financialForm.patchValue(dataInBrl, { emitEvent: false });
  }

  private convertDataForDisplay(data: FinancialInputs): FinancialInputs {
      const convertedData: Partial<FinancialInputs> = {};
      for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
              const typedKey = key as keyof FinancialInputs;
              const value = data[typedKey];
              if (typeof value === 'number') {
                  convertedData[typedKey] = parseFloat(this.currencyService.convertFromUsd(value, 'BRL').toFixed(2));
              } else {
                  convertedData[typedKey] = value;
              }
          }
      }
      return convertedData as FinancialInputs;
  }

  private convertDataForSave(data: FinancialInputs): FinancialInputs {
      const convertedData: Partial<FinancialInputs> = {};
      for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
              const typedKey = key as keyof FinancialInputs;
              const value = data[typedKey];
              if (typeof value === 'number') {
                  convertedData[typedKey] = this.currencyService.convertToUsdFrom(value, 'BRL');
              } else {
                  convertedData[typedKey] = value;
              }
          }
      }
      return convertedData as FinancialInputs;
  }

  saveData() {
    const formDataInBrl = this.financialForm.value as FinancialInputs;
    const dataToSaveInUsd = this.convertDataForSave(formDataInBrl);
    
    this.financialDataService.saveData(dataToSaveInUsd);
    
    this.toastService.show({
        messageKey: 'financial_data_saved'
    });
    this.financialForm.markAsPristine();
  }

  exportAnalysis(format: 'pdf' | 'txt' | 'md') {
    const data = this.analysis();
    const inputs = this.financialData();
    if (data) {
      this.exportService.exportFinancialAnalysis(data, inputs, format);
    }
    this.showExportMenu.set(false);
  }
}