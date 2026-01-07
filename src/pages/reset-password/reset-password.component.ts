import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastService } from '../../services/toast.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  return password && confirmPassword && password.value !== confirmPassword.value ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="glass-content w-full max-w-md p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-white">{{ 'reset_password_title' | translate }}</h2>
          <p class="mt-2 text-sm text-gray-400">{{ 'reset_password_desc' | translate }}</p>
        </div>
        
        <form class="space-y-6" [formGroup]="resetPasswordForm" (ngSubmit)="resetPassword()">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">{{ 'new_password' | translate }}</label>
            <input id="password" type="password" formControlName="password" required
                   class="clyro-input">
             @if (password?.invalid && password?.touched) {
              <div class="text-red-400 text-sm mt-1">
                @if (password?.errors?.['required']) { <span>{{ 'required_field' | translate }}</span> }
                @if (password?.errors?.['minlength']) { <span>{{ 'password_min_length' | translate }}</span> }
              </div>
            }
          </div>
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1.5">{{ 'confirm_new_password' | translate }}</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword" required
                   class="clyro-input">
            @if (resetPasswordForm.hasError('passwordMismatch') && confirmPassword?.touched) {
              <p class="text-red-400 text-sm mt-1">{{ 'passwords_do_not_match' | translate }}</p>
            }
          </div>
          <div>
            <button type="submit" [disabled]="resetPasswordForm.invalid || isLoading()"
                    class="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white btn-primary-gradient disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              @if (isLoading()) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              {{ 'set_new_password' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  
  resetPasswordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  get password() { return this.resetPasswordForm.get('password'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  ngOnInit() {
    if (!this.authService.getPendingResetEmail()) {
      this.router.navigate(['/login']);
    }
  }

  async resetPassword() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const newPassword = this.resetPasswordForm.value.password!;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = this.authService.resetPassword(newPassword);

    if(success) {
        this.toastService.show({
            titleKey: 'password_reset_success_title',
            messageKey: 'password_reset_success_body',
            type: 'success',
        });
        this.router.navigate(['/login']);
    } else {
        this.toastService.show({
            messageKey: 'An unexpected error occurred.',
            type: 'error'
        });
        this.router.navigate(['/login']);
    }
    
    this.isLoading.set(false);
  }
}