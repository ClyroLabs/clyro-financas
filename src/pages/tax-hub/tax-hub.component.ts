import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { TaxCalculatorComponent } from '../tax-calculator/tax-calculator.component';
import { SimpleTaxCalculatorComponent } from '../simple-tax-calculator/simple-tax-calculator.component';

@Component({
  selector: 'app-tax-hub',
  standalone: true,
  imports: [TranslatePipe, RouterLink, TaxCalculatorComponent, SimpleTaxCalculatorComponent],
  templateUrl: './tax-hub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxHubComponent {
  authService = inject(AuthService);
  
  activeTab = signal<'simple' | 'smart'>('simple');
  
  isSmartCalculationLocked = computed(() => this.authService.subscriptionPlan() === 'free');
}
