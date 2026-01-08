import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../services/currency.service';

@Pipe({
  name: 'dynamicCurrency',
  standalone: true,
  pure: false
})
export class DynamicCurrencyPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  transform(valueInUsd: number | null | undefined, skipConversion: boolean = false): string {
    if (valueInUsd === null || valueInUsd === undefined) {
      return '';
    }

    const valueToFormat = skipConversion ? valueInUsd : this.currencyService.convert(valueInUsd);
    return this.currencyService.format(valueToFormat);
  }
}