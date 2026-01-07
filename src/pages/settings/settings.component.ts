import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService, Language } from '../../services/translation.service';
import { CurrencyService, Currency } from '../../services/currency.service';
import { AuthService } from '../../services/auth.service';
import { TwoFactorMethod } from '../../models/user.model';
import { ToastService } from '../../services/toast.service';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { Setup2faModalComponent } from '../../components/setup-2fa-modal/setup-2fa-modal.component';
import { UiStateService } from '../../services/ui-state.service';
import { PhoneMaskDirective } from '../../directives/phone-mask.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, NgOptimizedImage, ConfirmationModalComponent, Setup2faModalComponent, PhoneMaskDirective],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  translationService = inject(TranslationService);
  currencyService = inject(CurrencyService);
  authService = inject(AuthService);
  uiStateService = inject(UiStateService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  
  user = this.authService.user;
  currentPlan = this.authService.subscriptionPlan;
  
  profileForm = this.fb.group({
    name: [this.user()?.name || ''],
    address: [this.user()?.address || ''],
    phoneNumber: [this.user()?.phoneNumber || ''],
  });
  
  preferencesForm = this.fb.group({
    language: new FormControl<Language>(this.translationService.currentLang()),
    currency: new FormControl<Currency>(this.currencyService.selectedCurrency()),
  });

  securityForm = this.fb.group({
    use2fa: new FormControl<boolean>(this.user()?.use2fa || false),
    twoFactorMethod: new FormControl<TwoFactorMethod>(this.user()?.twoFactorMethod || 'none'),
  });

  previewUrl = signal<string | null>(this.user()?.avatarUrl || null);
  
  // Modal states
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  show2faSetupModal = signal(false);
  
  constructor() {
    this.securityForm.get('twoFactorMethod')?.valueChanges.subscribe(method => {
      const use2fa = this.securityForm.get('use2fa')?.value;
      if (use2fa && method === 'authenticator') {
        if (this.user()?.twoFactorMethod !== 'authenticator') {
            this.show2faSetupModal.set(true);
        }
      }
    });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    const profileData: any = {
      ...this.profileForm.value,
      avatarUrl: this.previewUrl() || this.user()?.avatarUrl,
    };
    
    this.authService.updateUserProfile(profileData);
    this.toastService.show({ messageKey: 'profile_updated', type: 'success' });
    this.profileForm.markAsPristine();
  }

  savePreferences() {
    if (this.preferencesForm.invalid) return;
    const { language, currency } = this.preferencesForm.value;
    if (language) this.translationService.setLanguage(language);
    if (currency) this.currencyService.setCurrency(currency);
    
    this.toastService.show({ messageKey: 'settings_updated', type: 'success' });
    this.preferencesForm.markAsPristine();
  }

  saveSecuritySettings(isFrom2faSetup: boolean = false) {
    if (this.securityForm.invalid) return;

    const { use2fa, twoFactorMethod } = this.securityForm.value;
    const settings: any = { use2fa, twoFactorMethod };
    
    if (!use2fa) {
        settings.twoFactorMethod = 'none';
        settings.twoFactorSecret = '';
    } else if(isFrom2faSetup) {
        settings.twoFactorSecret = this.user()?.twoFactorSecret; // Keep existing mock secret
    }

    this.authService.updateUserSettings(settings);

    if (isFrom2faSetup) {
         this.toastService.show({ titleKey: 'setup_2fa_success_toast_title', messageKey: 'setup_2fa_success_toast_body', type: 'success' });
    } else if (use2fa && twoFactorMethod === 'email') {
        this.toastService.show({ titleKey: 'setup_2fa_success_toast_title', messageKey: 'setup_2fa_email_success_toast_body', type: 'success' });
    }
    else {
        this.toastService.show({ messageKey: 'settings_updated', type: 'success' });
    }
    this.securityForm.markAsPristine();
  }

  // --- 2FA Modal Logic ---
  handle2faSetupVerified() {
    this.show2faSetupModal.set(false);
    this.saveSecuritySettings(true);
  }

  handle2faSetupCancel() {
    this.show2faSetupModal.set(false);
    // Revert form state if user cancels
    this.securityForm.patchValue({ 
        use2fa: this.user()?.use2fa,
        twoFactorMethod: this.user()?.twoFactorMethod
    });
  }

  // --- Delete Account Logic ---
  async deleteAccount() {
    this.isDeleting.set(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    this.authService.deleteAccount();
    
    this.toastService.show({
      titleKey: 'account_deleted_toast_title',
      messageKey: 'account_deleted_toast_body',
      type: 'success'
    });

    this.isDeleting.set(false);
    this.showDeleteModal.set(false);
  }
}