import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PricingService } from '../../services/pricing.service';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';

// Custom validator to check if yearly price is greater than monthly price
export const yearlyPriceValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!(control instanceof FormGroup)) {
    return null;
  }

  const basicMonthly = control.get('basicMonthly')?.value;
  const basicYearly = control.get('basicYearly')?.value;
  const premiumMonthly = control.get('premiumMonthly')?.value;
  const premiumYearly = control.get('premiumYearly')?.value;

  const errors: ValidationErrors = {};

  if (basicMonthly !== null && basicYearly !== null && basicYearly <= basicMonthly) {
    errors['basicYearlyInvalid'] = true;
  }

  if (premiumMonthly !== null && premiumYearly !== null && premiumYearly <= premiumMonthly) {
    errors['premiumYearlyInvalid'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, ConfirmationModalComponent, DecimalPipe],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent {
  private fb = inject(FormBuilder);
  private pricingService = inject(PricingService);
  private adminService = inject(AdminService);
  notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  prices = this.pricingService.prices;
  settings = this.adminService.settings;

  // User Management
  users = computed(() => this.authService.users().filter(u => u.email !== this.authService.user()?.email));
  showDeleteUserModal = signal(false);
  isDeletingUser = signal(false);
  userToDelete = signal<User | null>(null);
  deleteUserMessageParams = computed(() => ({ email: this.userToDelete()?.email ?? '' }));

  priceForm = this.fb.group({
    basicMonthly: [this.prices().basic.monthly, [Validators.required, Validators.min(0.01)]],
    basicYearly: [this.prices().basic.yearly, [Validators.required, Validators.min(0.01)]],
    premiumMonthly: [this.prices().premium.monthly, [Validators.required, Validators.min(0.01)]],
    premiumYearly: [this.prices().premium.yearly, [Validators.required, Validators.min(0.01)]]
  }, { validators: yearlyPriceValidator });

  paymentForm = this.fb.group({
    stripeApiKey: [this.settings().stripeApiKey, Validators.required],
    gatePayClientId: [this.settings().gatePayClientId, Validators.required],
    gatePayApiKey: [this.settings().gatePayApiKey, Validators.required],
    gatePayApiSecret: [this.settings().gatePayApiSecret, Validators.required]
  });

  generalForm = this.fb.group({
    appName: [this.settings().appName, Validators.required],
    appLogoUrl: [this.settings().appLogoUrl],
    siteUrl: [this.settings().siteUrl, Validators.required],
  });

  checkoutForm = this.fb.group({
    enableCreditCard: [this.settings().enableCreditCard],
    enableCrypto: [this.settings().enableCrypto],
    checkoutLogoUrl: [this.settings().checkoutLogoUrl]
  });

  updatePrices() {
    if (this.priceForm.valid) {
      const formValue = this.priceForm.value;
      this.pricingService.updatePrices(
        formValue.basicMonthly ?? 0,
        formValue.premiumMonthly ?? 0
      );
      this.toastService.show({ messageKey: 'prices_updated' });
    }
  }

  savePaymentConfiguration() {
    if (this.paymentForm.valid) {
      this.adminService.updateSettings({
        stripeApiKey: this.paymentForm.value.stripeApiKey ?? '',
        gatePayClientId: this.paymentForm.value.gatePayClientId ?? '',
        gatePayApiKey: this.paymentForm.value.gatePayApiKey ?? '',
        gatePayApiSecret: this.paymentForm.value.gatePayApiSecret ?? ''
      });
      this.toastService.show({ messageKey: 'configuration_saved' });
    }
  }

  saveGeneralSettings() {
    if (this.generalForm.valid) {
      this.adminService.updateSettings(this.generalForm.value);
      this.toastService.show({ messageKey: 'configuration_saved' });
    }
  }

  saveCheckoutSettings() {
    if (this.checkoutForm.valid) {
      this.adminService.updateSettings({
        enableCreditCard: this.checkoutForm.value.enableCreditCard,
        enableCrypto: this.checkoutForm.value.enableCrypto,
        checkoutLogoUrl: this.checkoutForm.value.checkoutLogoUrl
      });
      this.toastService.show({ messageKey: 'configuration_saved' });
    }
  }

  sendTestNotification() {
    const t = this.translationService.translate();
    const title = t('test_notification_title');
    const options = {
      body: t('test_notification_body'),
      icon: '/favicon.ico'
    };
    this.notificationService.showLocalNotification(title, options);
    this.toastService.show({ messageKey: 'test_notification_sent', type: 'info' });
  }

  // --- User Deletion Methods ---
  openDeleteUserModal(user: User) {
    this.userToDelete.set(user);
    this.showDeleteUserModal.set(true);
  }

  cancelDeleteUser() {
    this.showDeleteUserModal.set(false);
    this.userToDelete.set(null);
  }

  confirmDeleteUser() {
    const user = this.userToDelete();
    if (!user) return;

    this.isDeletingUser.set(true);

    setTimeout(() => { // Simulate API call
      const success = this.authService.deleteUserByEmail(user.email);
      if (success) {
        this.toastService.show({
          titleKey: 'user_deleted_toast_title',
          messageKey: 'user_deleted_toast_body',
          type: 'success'
        });
      }
      this.isDeletingUser.set(false);
      this.cancelDeleteUser();
    }, 1500);
  }

  // --- User Blocking Methods ---
  showBlockUserModal = signal(false);
  isBlockingUser = signal(false);
  userToBlock = signal<User | null>(null);
  blockReason = signal('');
  blockReasonOptions = [
    'violation_terms_of_service',
    'violation_spam',
    'violation_abuse',
    'violation_fraud',
    'violation_other'
  ];

  openBlockUserModal(user: User) {
    this.userToBlock.set(user);
    this.blockReason.set('');
    this.showBlockUserModal.set(true);
  }

  cancelBlockUser() {
    this.showBlockUserModal.set(false);
    this.userToBlock.set(null);
    this.blockReason.set('');
  }

  confirmBlockUser() {
    const user = this.userToBlock();
    const reason = this.blockReason();
    if (!user || !reason) return;

    this.isBlockingUser.set(true);

    setTimeout(() => {
      this.authService.blockUser(user.email, reason);
      this.toastService.show({
        messageKey: 'user_blocked_success',
        type: 'success'
      });
      this.isBlockingUser.set(false);
      this.cancelBlockUser();
    }, 1000);
  }

  unblockUser(user: User) {
    this.authService.unblockUser(user.email);
    this.toastService.show({
      messageKey: 'user_unblocked_success',
      type: 'success'
    });
  }

  // --- Theme Management ---
  currentTheme = this.adminService.theme;

  setTheme(theme: 'dark' | 'light' | 'transparent') {
    this.adminService.setTheme(theme);
    this.toastService.show({ messageKey: 'theme_updated', type: 'info' });
  }

  // --- Admin Management ---
  adminUsers = computed(() => this.authService.users().filter(u => u.role === 'admin' || u.role === 'super-admin'));
  regularUsers = computed(() => this.authService.users().filter(u => u.role === 'user' && u.email !== this.authService.user()?.email));

  promoteToAdmin(user: User) {
    this.authService.updateUserRole(user.email, 'admin');
    this.toastService.show({ messageKey: 'user_promoted_to_admin', type: 'success' });
  }

  demoteFromAdmin(user: User) {
    this.authService.updateUserRole(user.email, 'user');
    this.toastService.show({ messageKey: 'user_demoted_from_admin', type: 'success' });
  }

  // --- Financial Reports ---
  financialReport = computed(() => {
    const users = Object.values(this.authService.users());
    const basicPrice = this.pricingService.prices().basic.monthly;
    const premiumPrice = this.pricingService.prices().premium.monthly;

    const freeUsers = users.filter(u => u.subscriptionPlan === 'free').length;
    const basicUsers = users.filter(u => u.subscriptionPlan === 'basic').length;
    const premiumUsers = users.filter(u => u.subscriptionPlan === 'premium').length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;

    return {
      totalActiveSubscriptions: basicUsers + premiumUsers,
      monthlyRevenue: (basicUsers * basicPrice) + (premiumUsers * premiumPrice),
      freeUsers,
      basicUsers,
      premiumUsers,
      blockedUsers
    };
  });
}

