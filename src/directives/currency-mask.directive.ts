import { Directive, HostListener, ElementRef, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { NgControl } from '@angular/forms';
import { CurrencyService } from '../services/currency.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl);
  private currencyService = inject(CurrencyService);
  private sub: Subscription | null = null;

  constructor() {
    // Re-format if the currency changes globally.
    // Must be in constructor to provide injection context for effect().
    effect(() => {
        this.currencyService.currencyInfo(); // Register dependency
        
        // Use optional chaining as control might not be ready on first run, 
        // but will be available when currency changes later.
        const currentValue = this.ngControl.control?.value;
        if (currentValue !== null && currentValue !== undefined) {
            this.setFormattedValue(currentValue);
        }
    });
  }

  ngOnInit() {
    this.formatOnLoad();
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    // 1. Strip everything that is not a number
    const numericString = value.replace(/\D/g, '');

    // 2. Handle empty case
    if (!numericString) {
      this.ngControl.control?.setValue(null);
      this.el.nativeElement.value = '';
      return;
    }

    // 3. Convert to float (cents)
    const numericValue = parseFloat(numericString) / 100;

    // 4. Update the form control with the raw number (for calculations)
    this.ngControl.control?.setValue(numericValue, { emitEvent: false });

    // 5. Update the input display with the formatted currency
    this.setFormattedValue(numericValue);
  }

  // Handle external updates (like patchValue from presets)
  private formatOnLoad() {
    setTimeout(() => {
      if (this.ngControl.control?.value !== null && this.ngControl.control?.value !== undefined) {
        this.setFormattedValue(this.ngControl.control?.value);
      } else {
        // Ensure it's empty string so placeholder shows immediately
        this.el.nativeElement.value = '';
      }
    });
    
    // Subscribe to value changes to handle programmatic updates
    this.sub = this.ngControl.valueChanges!.subscribe(value => {
        if (value !== null && value !== undefined && typeof value === 'number') {
             // Only format if the element isn't currently focused to avoid cursor jumping issues during rapid external updates,
             // or check if the visual value doesn't match the numeric value
             const numericString = this.el.nativeElement.value.replace(/\D/g, '');
             const currentVisualValue = parseFloat(numericString) / 100;
             
             if (currentVisualValue !== value) {
                 this.setFormattedValue(value);
             }
        } else if (value === null) {
             this.el.nativeElement.value = '';
        }
    });
  }

  private setFormattedValue(value: number) {
    const { locale, currency } = this.currencyService.currencyInfo();
    
    // Use Intl.NumberFormat for correct localization
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

    this.el.nativeElement.value = formatted;
  }
}