import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-setup-2fa-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, NgOptimizedImage],
  template: `
    @if (show()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="onClose()">
        <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700/50" (click)="$event.stopPropagation()">
          <form [formGroup]="form" (ngSubmit)="onVerify()">
            <div class="p-6">
              <h3 class="text-xl font-bold text-white mb-4">{{ 'setup_2fa_title' | translate }}</h3>
              
              <div class="text-center bg-gray-900 p-4 rounded-lg">
                <p class="text-sm text-gray-300 mb-4">{{ 'setup_2fa_qr_message' | translate }}</p>
                <img [ngSrc]="qrCodeUrl()" width="150" height="150" class="mx-auto rounded-md" alt="Mock QR Code">
                
                <p class="text-sm text-gray-300 mt-4">{{ 'setup_2fa_key_message' | translate }}</p>
                <div class="mt-2 bg-gray-700 text-cyan-400 font-mono tracking-widest px-3 py-2 rounded-md inline-block">
                  {{ secretKey() }}
                </div>
              </div>

              <p class="text-sm text-gray-300 mt-6 mb-2">{{ 'setup_2fa_verify_message' | translate }}</p>
              <div>
                <label for="code" class="sr-only">{{ 'verification_code' | translate }}</label>
                <input 
                  type="text" 
                  id="code" 
                  formControlName="code"
                  maxlength="6"
                  class="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white text-center text-2xl tracking-[1em] focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="_ _ _ _ _ _">
              </div>
            </div>
            <div class="bg-gray-900/50 px-6 py-4 rounded-b-lg flex justify-end items-center space-x-4">
              <button type="button" (click)="onClose()" class="px-4 py-2 text-sm font-semibold rounded-md transition hover:bg-gray-700 text-white">
                {{ 'cancel' | translate }}
              </button>
              <button 
                type="submit"
                [disabled]="form.invalid || isLoading()"
                class="px-4 py-2 text-sm font-semibold rounded-md transition bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center min-w-[100px] justify-center">
                  @if (isLoading()) {
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ 'processing' | translate }}
                  } @else {
                    {{ 'verify' | translate }}
                  }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Setup2faModalComponent {
  show = input.required<boolean>();
  secretKey = input.required<string>();

  verified = output<void>();
  cancel = output<void>();

  private fb = new FormBuilder();
  isLoading = signal(false);

  qrCodeUrl = computed(() => {
    const secret = this.secretKey();
    // In a real app, the user's email would be dynamic.
    const data = encodeURIComponent(`otpauth://totp/Clyro:user@clyro.com?secret=${secret}&issuer=Clyro`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}`;
  });

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  async onVerify() {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    // Simulate verification API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isLoading.set(false);

    // In a real app, you'd verify the code. Here we just assume it's correct.
    this.verified.emit();
    this.form.reset();
  }

  onClose() {
    this.cancel.emit();
    this.form.reset();
  }
}
