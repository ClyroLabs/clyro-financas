import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TwoFactorAuthModalComponent } from '../../components/two-factor-auth-modal/two-factor-auth-modal.component';
import { GoogleAuthModalComponent } from '../../components/google-auth-modal/google-auth-modal.component';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, TwoFactorAuthModalComponent, GoogleAuthModalComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  adminService = inject(AdminService);
  private router = inject(Router);

  loginFailed = signal(false);
  isLoading = signal(false);
  showGoogleModal = signal(false);
  
  settings = this.adminService.settings;
  // Expose the signal from the service to the template
  requires2fa = this.authService.requires2fa;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginFailed.set(false);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { email, password } = this.loginForm.value;
    const success = this.authService.login(email!, password!);

    this.isLoading.set(false);
    if (!success) {
      this.loginFailed.set(true);
    } else if (!this.requires2fa()) {
      // If login was successful and 2FA is not required, navigate away
      this.router.navigate(['/dashboard']);
    }
    // If 2FA is required, the modal will appear automatically via the signal
  }

  on2faSuccess() {
    this.router.navigate(['/dashboard']);
  }

  openGoogleModal() {
    this.showGoogleModal.set(true);
  }

  handleGoogleLogin(email: string) {
    this.showGoogleModal.set(false);
    this.isLoading.set(true);
    // Simulate network delay for OAuth flow
    setTimeout(() => {
      this.authService.loginWithGoogle(email);
      // Navigation is handled inside the auth service method.
    }, 500);
  }
}
