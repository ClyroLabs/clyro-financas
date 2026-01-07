import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DynamicCurrencyPipe } from '../../pipes/dynamic-currency.pipe';
import { AuthService } from '../../services/auth.service';
import { PricingService } from '../../services/pricing.service';
import { CurrencyService, CryptoAsset } from '../../services/currency.service';
import { AdminService } from '../../services/admin.service';
import { Web3Service } from '../../services/web3.service';
import { GatePayService } from '../../services/gatepay.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

type PaymentMethod = 'credit-card' | 'crypto-web3' | 'crypto-gatepay';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [TranslatePipe, DynamicCurrencyPipe],
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
  
  settings = this.adminService.settings;

  planDisplayName = computed(() => {
    const p = this.plan();
    return p ? this.translationService.translate()(p) : '';
  });

  currentPlanDisplayName = computed(() => {
    const p = this.currentPlan();
    return p ? this.translationService.translate()(p) : '';
  });

  constructor() {
     effect(() => {
      const targetPlan = this.plan();
      const currentSubPlan = this.currentPlan();
      const cycle = this.billingCycle();

      if (targetPlan && currentSubPlan) {
        const newPrice = this.pricingService.getPrice(targetPlan, cycle);
        
        let oldPrice = 0;
        if (currentSubPlan !== 'free') {
            oldPrice = this.pricingService.getPrice(currentSubPlan as 'basic' | 'premium', cycle);
        }

        const proratedPrice = Math.max(0, newPrice - oldPrice);
        this.price.set(proratedPrice);
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
    }
    
    const newPlan = this.plan();
    if (newPlan) {
      this.authService.setSubscriptionPlan(newPlan);
      const t = this.translationService.translate();
      const planName = t(newPlan);
      this.toastService.show({
        titleKey: 'notification_payment_success_title',
        messageKey: 'notification_payment_success_body',
        params: { planName }
      });
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
