import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-consulting',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div class="max-w-3xl mx-auto w-full text-center">
          <h1 class="text-3xl font-bold tracking-tight text-white">{{ 'consulting_title' | translate }}</h1>
          <p class="mt-2 text-lg text-gray-400">
             {{ 'consulting_desc' | translate }}
          </p>
      </div>

       <div class="mt-10 max-w-3xl mx-auto w-full">
           <div class="glass-card p-8 rounded-2xl border border-white/10 backdrop-blur-md">
                <h2 class="text-2xl font-bold text-white mb-8">{{ 'consulting_form_title' | translate }}</h2>
                <form [formGroup]="consultingForm" (ngSubmit)="submitRequest()" class="space-y-6">
                    <div>
                      <label for="topic" class="block text-sm font-bold text-white mb-1.5">{{ 'consulting_topic' | translate }}</label>
                      <select id="topic" formControlName="topic" class="clyro-select clyro-input">
                        <option value="ai_business_consulting">{{ 'ai_business_consulting' | translate }}</option>
                        <option value="web3_projects">{{ 'web3_projects' | translate }}</option>
                        <option value="marketing_copywriting">{{ 'marketing_copywriting' | translate }}</option>
                        <option value="audiovisual_production">{{ 'audiovisual_production' | translate }}</option>
                        <option value="investment_strategies">{{ 'investment_strategies' | translate }}</option>
                        <option value="debt_management">{{ 'debt_management' | translate }}</option>
                        <option value="tax_optimization">{{ 'tax_optimization' | translate }}</option>
                        <option value="business_finance">{{ 'business_finance' | translate }}</option>
                        <option value="other">{{ 'other' | translate }}</option>
                      </select>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label for="preferredDate" class="block text-sm font-bold text-white mb-1.5">{{ 'preferred_date' | translate }}</label>
                            <input type="date" id="preferredDate" formControlName="preferredDate" class="clyro-input">
                        </div>
                        <div>
                            <label for="preferredTime" class="block text-sm font-bold text-white mb-1.5">{{ 'preferred_time' | translate }}</label>
                            <input type="time" id="preferredTime" formControlName="preferredTime" class="clyro-input">
                        </div>
                    </div>
                    
                     <div>
                      <label for="notes" class="block text-sm font-bold text-white mb-1.5">{{ 'additional_notes' | translate }}</label>
                      <textarea id="notes" formControlName="notes" rows="4" class="clyro-input"></textarea>
                    </div>

                    <button type="submit" [disabled]="consultingForm.invalid || isLoading()" class="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white btn-primary-gradient disabled:opacity-50 disabled:cursor-not-allowed">
                        @if (isLoading()) {
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        }
                        {{ 'submit_request' | translate }}
                    </button>
                </form>
           </div>
       </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultingComponent {
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  isLoading = signal(false);

  consultingForm = this.fb.group({
    topic: ['ai_business_consulting', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required],
    notes: [''],
  });

  async submitRequest() {
    if (this.consultingForm.invalid) {
      this.consultingForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Consultation Request:', this.consultingForm.value);
    
    this.toastService.show({
        titleKey: 'consultation_booked_title',
        messageKey: 'consultation_booked_body',
        type: 'success'
    });
    
    this.consultingForm.reset({ topic: 'ai_business_consulting' });
    this.isLoading.set(false);
  }
}