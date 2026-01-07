import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="glass-content w-full max-w-md p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-white">{{ 'forgot_password_title' | translate }}</h2>
          <p class="mt-2 text-sm text-gray-400">{{ 'forgot_password_desc' | translate }}</p>
        </div>
        
        <form class="space-y-6" [formGroup]="forgotPasswordForm" (ngSubmit)="sendResetLink()">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-1.5">{{ 'email_address' | translate }}</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" required
                   class="clyro-input">
             @if (email?.invalid && email?.touched) {
              <div class="text-red-400 text-sm mt-1">
                @if (email?.errors?.['required']) { <span>{{ 'required_field' | translate }}</span> }
                @if (email?.errors?.['email']) { <span>{{ 'invalid_email' | translate }}</span> }
              </div>
            }
          </div>
          <div>
            <button type="submit" [disabled]="forgotPasswordForm.invalid || isLoading()"
                    class="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white btn-primary-gradient disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              @if (isLoading()) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              {{ 'send_reset_link' | translate }}
            </button>
          </div>
        </form>
        
        <div class="text-sm text-center">
          <a routerLink="/login" class="font-medium text-cyan-400 hover:text-cyan-300">
            {{ 'back_to_login' | translate }}
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = signal(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() { return this.forgotPasswordForm.get('email'); }

  async sendResetLink() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.forgotPasswordForm.value.email!;
    
    const userExists = this.authService.requestPasswordReset(email);

    this.toastService.show({
      titleKey: 'reset_email_sent_title',
      messageKey: 'reset_email_sent_body',
      type: 'info',
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (userExists) {
        // For demonstration, navigate directly to reset page.
        this.router.navigate(['/reset-password']);
    } else {
        this.router.navigate(['/login']);
    }

    this.isLoading.set(false);
  }
}