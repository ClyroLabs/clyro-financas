import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatNumber } from '@angular/common';
import { CurrencyService } from '../services/currency.service';

@Pipe({
  name: 'dynamicDecimal',
  standalone: true,
  pure: false
})
export class DynamicDecimalPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  transform(value: number | null | undefined, format: string = '1.2-2'): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const { locale } = this.currencyService.currencyInfo();
    return formatNumber(value, locale, format);
  }
}