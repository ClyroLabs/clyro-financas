import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-two-factor-auth-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './two-factor-auth-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorAuthModalComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  show = this.authService.requires2fa;
  successfulVerification = output<void>();

  isLoading = signal(false);
  invalidCode = signal(false);

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  async verify() {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.invalidCode.set(false);

    const code = this.form.value.code!;
    const success = await this.authService.verify2fa(code);

    this.isLoading.set(false);

    if (success) {
      this.successfulVerification.emit();
    } else {
      this.invalidCode.set(true);
    }
  }

  onClose() {
    // Intentionally left blank, as we don't want users to close this modal easily.
    // They must complete 2FA. A real app might have a "cancel login" option.
  }
}