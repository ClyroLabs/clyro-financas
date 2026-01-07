import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appPhoneMask]',
  standalone: true
})
export class PhoneMaskDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl);

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    const rawValue = value.replace(/\D/g, '');
    let formattedValue = '';

    // Logic for generic/US/Brazil phone numbers
    if (rawValue.length === 0) {
      formattedValue = '';
    } else if (rawValue.length <= 2) {
      formattedValue = `(${rawValue}`;
    } else if (rawValue.length <= 6) {
      formattedValue = `(${rawValue.substring(0, 2)}) ${rawValue.substring(2)}`;
    } else if (rawValue.length <= 10) {
      // (XX) XXXX-XXXX
      formattedValue = `(${rawValue.substring(0, 2)}) ${rawValue.substring(2, 6)}-${rawValue.substring(6)}`;
    } else {
      // (XX) XXXXX-XXXX (Mobile 11 digits)
      formattedValue = `(${rawValue.substring(0, 2)}) ${rawValue.substring(2, 7)}-${rawValue.substring(7, 11)}`;
    }

    // Limit length
    if (rawValue.length > 11) {
        formattedValue = formattedValue.substring(0, 15); // Max visual length
    }

    this.ngControl.control?.setValue(formattedValue, { emitEvent: false });
    this.el.nativeElement.value = formattedValue;
  }
}