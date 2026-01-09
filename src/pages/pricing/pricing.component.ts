import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PricingService } from '../../services/pricing.service';
import { CurrencyService } from '../../services/currency.service';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [TranslatePipe, ConfirmationModalComponent],
  templateUrl: './pricing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingComponent {
  authService = inject(AuthService);
  router = inject(Router);
  pricingService = inject(PricingService);
  currencyService = inject(CurrencyService);
  translationService = inject(TranslationService);
  toastService = inject(ToastService);

  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  currentPlan = this.authService.subscriptionPlan;

  prices = this.pricingService.prices;

  // Downgrade state
  showDowngradeModal = signal(false);
  isProcessingDowngrade = signal(false);
  downgradeToPlan = signal<'free' | 'basic' | 'premium' | null>(null);

  // Upgrade state
  showUpgradeModal = signal(false);
  upgradeToPlan = signal<'basic' | 'premium' | null>(null);

  private planLevels = { free: 0, basic: 1, premium: 2 };

  basicPrice = computed(() => this.prices().basic[this.billingCycle()]);
  premiumPrice = computed(() => this.prices().premium[this.billingCycle()]);

  // Calculate proportional refund for downgrade
  calculateRefundAmount = computed(() => {
    const targetPlan = this.downgradeToPlan();
    const currentPlanKey = this.currentPlan();
    if (!targetPlan || targetPlan === currentPlanKey) return 0;

    const cycle = this.authService.billingCycle();
    const currentPrice = this.getCurrentPlanPrice(currentPlanKey, cycle);
    const targetPrice = this.getTargetPlanPrice(targetPlan, cycle);

    const daysRemaining = this.authService.getDaysRemainingInCycle();
    const totalDays = this.authService.getTotalDaysInCycle();

    return this.authService.calculateProportionalRefund(
      currentPrice, targetPrice, daysRemaining, totalDays
    );
  });

  downgradeMessageParams = computed(() => {
    const planKey = this.downgradeToPlan();
    if (!planKey) return {};
    const refundAmount = this.calculateRefundAmount();
    const refundDate = this.authService.getBillingCycleEndDate();
    return {
      planName: this.translationService.translate()(planKey),
      refundAmount: this.currencyService.formatBRL(refundAmount),
      refundDate: refundDate.toLocaleDateString()
    };
  });

  upgradeMessageParams = computed(() => {
    const planKey = this.upgradeToPlan();
    if (!planKey) return {};
    const daysRemaining = this.authService.getDaysRemainingInCycle();
    return {
      planName: this.translationService.translate()(planKey),
      days: daysRemaining
    };
  });

  // Billing cycle info
  billingCycleEndDate = computed(() => {
    return this.authService.getBillingCycleEndDate().toLocaleDateString();
  });

  daysRemaining = computed(() => this.authService.getDaysRemainingInCycle());

  // Pending refund info
  pendingRefund = this.authService.pendingRefund;

  handlePlanSelection(targetPlan: 'basic' | 'premium') {
    if (this.planLevels[targetPlan] > this.planLevels[this.currentPlan()]) {
      // Upgrade
      this.openUpgradeModal(targetPlan);
    } else {
      // Downgrade
      this.openDowngradeModal(targetPlan);
    }
  }

  openUpgradeModal(plan: 'basic' | 'premium') {
    this.upgradeToPlan.set(plan);
    this.showUpgradeModal.set(true);
  }

  confirmUpgrade() {
    const plan = this.upgradeToPlan();
    if (plan) {
      this.router.navigate(['/checkout', plan], { queryParams: { billing: this.billingCycle() } });
    }
    this.cancelUpgrade();
  }

  cancelUpgrade() {
    this.showUpgradeModal.set(false);
    this.upgradeToPlan.set(null);
  }

  openDowngradeModal(plan: 'free' | 'basic' | 'premium') {
    this.downgradeToPlan.set(plan);
    this.showDowngradeModal.set(true);
  }

  confirmDowngrade() {
    this.isProcessingDowngrade.set(true);

    setTimeout(() => {
      const plan = this.downgradeToPlan();
      if (plan) {
        const refundAmount = this.calculateRefundAmount();
        // Apply downgrade immediately with refund scheduled
        this.authService.downgradePlan(plan, refundAmount);
        const t = this.translationService.translate();
        const planName = t(plan);

        if (refundAmount > 0) {
          const refundDate = this.authService.getBillingCycleEndDate().toLocaleDateString();
          this.toastService.show({
            titleKey: 'notification_downgrade_complete_title',
            messageKey: 'notification_downgrade_with_refund_body',
            params: { planName, refundAmount: this.currencyService.formatBRL(refundAmount), refundDate }
          });
        } else {
          this.toastService.show({
            titleKey: 'notification_downgrade_complete_title',
            messageKey: 'notification_downgrade_complete_body',
            params: { planName }
          });
        }
      }
      this.isProcessingDowngrade.set(false);
      this.showDowngradeModal.set(false);
      this.downgradeToPlan.set(null);
    }, 1500);
  }

  cancelDowngrade() {
    this.showDowngradeModal.set(false);
    this.downgradeToPlan.set(null);
  }

  getButtonAction(targetPlan: 'basic' | 'premium'): 'upgrade' | 'downgrade' | 'current' {
    if (this.currentPlan() === targetPlan) return 'current';
    return this.planLevels[targetPlan] > this.planLevels[this.currentPlan()] ? 'upgrade' : 'downgrade';
  }

  private getCurrentPlanPrice(plan: string, cycle: 'monthly' | 'yearly'): number {
    if (plan === 'basic') return this.prices().basic[cycle];
    if (plan === 'premium') return this.prices().premium[cycle];
    return 0;
  }

  private getTargetPlanPrice(plan: string, cycle: 'monthly' | 'yearly'): number {
    if (plan === 'basic') return this.prices().basic[cycle];
    if (plan === 'premium') return this.prices().premium[cycle];
    return 0; // free
  }
}

