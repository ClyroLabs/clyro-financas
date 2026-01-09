import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../services/currency.service';

@Pipe({
  name: 'dynamicCurrency',
  standalone: true,
  pure: false
})
export class DynamicCurrencyPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  /**
   * Formats a value in BRL (base currency) to the selected display currency.
   * Prices are stored in BRL, so we convert TO the selected currency.
   * @param valueInBrl - The value in BRL (Brazilian Real)
   * @param skipConversion - If true, format without currency conversion
   */
  transform(valueInBrl: number | null | undefined, skipConversion: boolean = false): string {
    if (valueInBrl === null || valueInBrl === undefined) {
      return '';
    }

    // Prices are stored in BRL (base currency)
    // If no conversion needed, just format in BRL
    if (skipConversion) {
      return this.currencyService.formatBRL(valueInBrl);
    }

    // Convert from BRL to selected currency and format
    const convertedValue = this.currencyService.convertFromBRL(valueInBrl);
    return this.currencyService.format(convertedValue);
  }
}