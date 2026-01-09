import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { PricingService } from '../../services/pricing.service';
import { CurrencyService, CryptoAsset } from '../../services/currency.service';
import { AdminService } from '../../services/admin.service';
import { Web3Service } from '../../services/web3.service';
import { GatePayService } from '../../services/gatepay.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

type PaymentMethod = 'credit-card' | 'crypto-web3' | 'crypto-gatepay' | 'pix' | 'bank-transfer-br' | 'bank-transfer-intl';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './checkout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);
  pricingService = inject(PricingService);
  currencyService = inject(CurrencyService);
  adminService = inject(AdminService);
  web3Service = inject(Web3Service);
  gatePayService = inject(GatePayService);
  translationService = inject(TranslationService);
  toastService = inject(ToastService);

  plan = signal<'basic' | 'premium' | null>(null);
  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  price = signal(0);
  currentPlan = this.authService.subscriptionPlan;

  selectedPaymentMethod = signal<PaymentMethod | null>(null);
  isLoading = signal(false);
  paymentError = signal<string | null>(null);

  // PIX state
  pixKeyCopied = signal(false);

  settings = this.adminService.settings;

  // Plan levels for comparison
  private planLevels = { free: 0, basic: 1, premium: 2 };

  planDisplayName = computed(() => {
    const p = this.plan();
    return p ? this.translationService.translate()(p) : '';
  });

  currentPlanDisplayName = computed(() => {
    const p = this.currentPlan();
    return p ? this.translationService.translate()(p) : '';
  });

  // Get the exact plan price (no proration or fees)
  planPrice = computed(() => {
    const targetPlan = this.plan();
    const cycle = this.billingCycle();
    if (!targetPlan) return 0;
    return this.pricingService.getPrice(targetPlan, cycle);
  });

  // Proration info (for reference, not for charging)
  daysRemaining = computed(() => this.authService.getDaysRemainingInCycle());
  totalDaysInCycle = computed(() => this.authService.getTotalDaysInCycle());

  // Determine if this is an upgrade or downgrade
  isUpgrade = computed(() => {
    const targetPlan = this.plan();
    const currentSubPlan = this.currentPlan();
    if (!targetPlan) return false;
    return this.planLevels[targetPlan] > this.planLevels[currentSubPlan];
  });

  isDowngrade = computed(() => {
    const targetPlan = this.plan();
    const currentSubPlan = this.currentPlan();
    if (!targetPlan) return false;
    return this.planLevels[targetPlan] < this.planLevels[currentSubPlan];
  });

  // Credit card installment options
  selectedInstallments = signal(1);
  maxInstallmentsWithoutFee = 3;
  cardFeePercent = 2.99; // Card brand fee for installments > 3

  // Calculate amount to pay (exact plan price + card fee if applicable)
  amountToPay = computed(() => {
    const basePrice = this.planPrice();
    const method = this.selectedPaymentMethod();
    const installments = this.selectedInstallments();

    // Only add fee for credit card with more than 3 installments
    if (method === 'credit-card' && installments > this.maxInstallmentsWithoutFee) {
      const fee = basePrice * (this.cardFeePercent / 100);
      return Math.round((basePrice + fee) * 100) / 100;
    }

    return basePrice;
  });

  // Calculate card fee amount
  cardFeeAmount = computed(() => {
    const basePrice = this.planPrice();
    const method = this.selectedPaymentMethod();
    const installments = this.selectedInstallments();

    if (method === 'credit-card' && installments > this.maxInstallmentsWithoutFee) {
      return Math.round((basePrice * (this.cardFeePercent / 100)) * 100) / 100;
    }
    return 0;
  });

  // Calculate refund amount for downgrades (proportional refund)
  refundAmount = computed(() => {
    const targetPlan = this.plan();
    const currentSubPlan = this.currentPlan();
    const cycle = this.billingCycle();

    if (!targetPlan || !currentSubPlan || currentSubPlan === 'free') return 0;

    const currentPrice = this.pricingService.getPrice(currentSubPlan as 'basic' | 'premium', cycle);
    const newPrice = this.pricingService.getPrice(targetPlan, cycle);

    const priceDiff = currentPrice - newPrice;
    if (priceDiff <= 0) return 0;

    // Calculate prorated refund based on days remaining
    const daysRemaining = this.daysRemaining();
    const totalDays = this.totalDaysInCycle();
    return Math.round(((priceDiff / totalDays) * daysRemaining) * 100) / 100;
  });

  // Refund method text
  refundMethodText = computed(() => {
    const t = this.translationService.translate();
    return t('checkout_refund_method_original');
  });

  // Billing cycle end date formatted
  billingEndDate = computed(() => {
    return this.authService.getBillingCycleEndDate().toLocaleDateString();
  });

  constructor() {
    effect(() => {
      // For upgrades: show exact plan price (with card fee if applicable)
      // For downgrades: price is 0 (user receives refund, doesn't pay)
      if (this.isDowngrade()) {
        this.price.set(0);
      } else {
        this.price.set(this.amountToPay());
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const planParam = params.get('plan');
      if (planParam === 'basic' || planParam === 'premium') {
        this.plan.set(planParam);
      } else {
        this.router.navigate(['/pricing']); // Invalid plan
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const billingParam = params.get('billing');
      if (billingParam === 'yearly') {
        this.billingCycle.set('yearly');
      } else {
        this.billingCycle.set('monthly');
      }
    });
  }

  selectPaymentMethod(method: PaymentMethod) {
    this.selectedPaymentMethod.set(method);
    this.paymentError.set(null);
    this.pixKeyCopied.set(false);
  }

  copyPixKey() {
    const pixKey = this.settings().pixKey;
    navigator.clipboard.writeText(pixKey).then(() => {
      this.pixKeyCopied.set(true);
      setTimeout(() => this.pixKeyCopied.set(false), 3000);
    });
  }

  async processPayment() {
    this.isLoading.set(true);
    this.paymentError.set(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const method = this.selectedPaymentMethod();

    if (method === 'credit-card') {
      console.log('Processing credit card payment...');
    } else if (method === 'crypto-web3') {
      console.log('Processing Web3 payment...');
    } else if (method === 'crypto-gatepay') {
      console.log('Processing GatePay payment...');
    } else if (method === 'pix') {
      console.log('Processing PIX payment...');
    } else if (method === 'bank-transfer-br' || method === 'bank-transfer-intl') {
      console.log('Processing bank transfer payment...');
    }

    const newPlan = this.plan();
    const cycle = this.billingCycle();
    if (newPlan) {
      const t = this.translationService.translate();
      const planName = t(newPlan);

      if (this.isDowngrade()) {
        // Apply downgrade immediately and schedule refund
        const refund = this.refundAmount();
        this.authService.downgradePlan(newPlan, refund);

        if (refund > 0) {
          const refundDate = this.authService.getBillingCycleEndDate().toLocaleDateString();
          this.toastService.show({
            titleKey: 'notification_downgrade_complete_title',
            messageKey: 'notification_downgrade_with_refund_body',
            params: { planName, refundAmount: this.currencyService.formatBRL(refund), refundDate }
          });
        } else {
          this.toastService.show({
            titleKey: 'notification_downgrade_complete_title',
            messageKey: 'notification_downgrade_complete_body',
            params: { planName }
          });
        }
      } else {
        // Upgrade immediately
        this.authService.upgradePlan(newPlan, cycle);
        this.toastService.show({
          titleKey: 'notification_payment_success_title',
          messageKey: 'notification_payment_success_body',
          params: { planName }
        });
      }

      this.isLoading.set(false);
      this.router.navigate(['/dashboard']);
    } else {
      this.paymentError.set('An unexpected error occurred.');
      this.isLoading.set(false);
    }
  }

  backToPricing() {
    this.router.navigate(['/pricing']);
  }
}
