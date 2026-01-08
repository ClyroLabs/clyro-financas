import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService, Language } from '../../services/translation.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './signup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  adminService = inject(AdminService);
  translationService = inject(TranslationService);

  signupFailed = signal(false);
  showLanguageMenu = signal(false);
  settings = this.adminService.settings;
  currentLang = this.translationService.currentLang;

  setLanguage(lang: Language) {
    this.translationService.setLanguage(lang);
    this.showLanguageMenu.set(false);
  }

  signupForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get name() {
    return this.signupForm.get('name');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  signup() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.signupForm.value;
    const success = this.authService.signup(name!, email!, password!);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.signupFailed.set(true);
    }
  }
}
