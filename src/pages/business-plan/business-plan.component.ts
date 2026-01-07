import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { GeminiService } from '../../services/gemini.service';
import { ExportService } from '../../services/pdf-export.service';
import { TranslationService } from '../../services/translation.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

interface BusinessPlan {
  executiveSummary: string;
  companyDescription: string;
  marketAnalysis: string;
  organizationAndManagement: string;
  productsOrServices: string;
  marketingAndSales: string;
  financialPlan: {
    startupCosts: string;
    monthlyOperatingCosts: string;
    revenueProjections: string;
    breakEvenAnalysis: string;
  };
  implementationRoadmap: string;
  keyPerformanceIndicators: string;
}

interface Niche {
  id: string;
  nameKey: string;
  icon: string;
}

@Component({
  selector: 'app-business-plan',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, SafeHtmlPipe],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      @if (geminiService.isInitialized()) {
        <div class="max-w-4xl mx-auto w-full text-center">
          <h1 class="text-3xl font-bold tracking-tight text-white">{{ 'business_plan_ai' | translate }}</h1>
          <p class="mt-2 text-lg text-gray-400">
            {{ 'business_plan_desc' | translate }}
          </p>
        </div>

        <div class="mt-8 flex-grow max-w-7xl mx-auto w-full">
          @if (!selectedNiche()) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (niche of niches; track niche.id) {
                <button (click)="selectNiche(niche)" class="w-full text-left p-6 glass-card hover:bg-white/10 hover:border-cyan-500/50 transition-all flex items-center group">
                  <div class="flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-transform" [innerHTML]="niche.icon | safeHtml"></div>
                  <h3 class="ml-4 text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">{{ niche.nameKey | translate }}</h3>
                </button>
              }
            </div>
          } @else {
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Form Section -->
              <div class="lg:w-1/3">
                <div class="glass-card p-6 rounded-2xl">
                  <div class="flex items-center mb-6">
                    <div class="flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 mr-4" [innerHTML]="selectedNiche()!.icon | safeHtml"></div>
                    <h2 class="text-2xl font-bold text-white">{{ selectedNiche()!.nameKey | translate }}</h2>
                  </div>
                  
                  <form [formGroup]="planForm" (ngSubmit)="generatePlan()" class="space-y-5">
                      <div>
                          <label for="businessName" class="block text-sm font-bold text-white mb-1.5">{{ 'business_name' | translate }}</label>
                          <input type="text" id="businessName" formControlName="businessName" class="clyro-input" [placeholder]="'business_name_placeholder' | translate">
                      </div>
                      <div>
                          <label for="businessDescription" class="block text-sm font-bold text-white mb-1.5">{{ 'business_description' | translate }}</label>
                          <textarea id="businessDescription" formControlName="businessDescription" rows="3" class="clyro-input" [placeholder]="'business_description_placeholder' | translate"></textarea>
                      </div>
                      <div>
                          <label for="targetAudience" class="block text-sm font-bold text-white mb-1.5">{{ 'target_audience' | translate }}</label>
                          <select id="targetAudience" formControlName="targetAudience" class="clyro-select clyro-input">
                              <option value="" disabled>{{ 'select_target_audience' | translate }}</option>
                              @for (option of targetAudienceOptions; track option.value) {
                                <option [value]="option.value">{{ option.labelKey | translate }}</option>
                              }
                          </select>
                      </div>
                      <div>
                          <label for="marketingStrategy" class="block text-sm font-bold text-white mb-1.5">{{ 'marketing_strategy' | translate }}</label>
                          <select id="marketingStrategy" formControlName="marketingStrategy" class="clyro-select clyro-input">
                              <option value="" disabled>{{ 'select_marketing_strategy' | translate }}</option>
                              @for (option of marketingStrategyOptions; track option.value) {
                                <option [value]="option.value">{{ option.labelKey | translate }}</option>
                              }
                          </select>
                      </div>
                      <div>
                          <label for="financialProjections" class="block text-sm font-bold text-white mb-1.5">{{ 'financial_projections' | translate }}</label>
                          <select id="financialProjections" formControlName="financialProjections" class="clyro-select clyro-input">
                              <option value="" disabled>{{ 'select_financial_range' | translate }}</option>
                              @for (option of financialProjectionOptions; track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                          </select>
                      </div>
                      <div>
                        <label for="language" class="block text-sm font-bold text-white mb-1.5">{{ 'insights_language' | translate }}</label>
                        <select id="language" formControlName="language" class="clyro-select clyro-input">
                            <option value="English">English</option>
                            <option value="Portuguese">Português</option>
                            <option value="Spanish">Español</option>
                        </select>
                      </div>
                      <button type="submit" [disabled]="planForm.invalid || isLoading()" class="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white btn-primary-gradient disabled:opacity-50 disabled:cursor-not-allowed">
                          @if (isLoading()) {
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          }
                          {{ (isLoading() ? 'generating_plan' : 'generate_business_plan') | translate }}
                      </button>
                  </form>
                  <button (click)="selectedNiche.set(null); businessPlan.set(null);" class="mt-4 w-full btn-back-gradient">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {{ 'back_to_niches' | translate }}
                  </button>
                </div>
              </div>

              <!-- Result Section -->
              <div class="lg:w-2/3 flex-grow">
                <div class="glass-card p-6 rounded-2xl h-full overflow-y-auto custom-scrollbar">
                    @if (isLoading()) {
                        <div class="flex flex-col items-center justify-center h-full">
                            <div class="relative w-20 h-20 mb-6">
                                <div class="absolute inset-0 rounded-full border-4 border-white/5"></div>
                                <div class="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <svg class="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                </div>
                            </div>
                            <p class="text-xl font-medium text-white animate-pulse">{{ 'generating_plan' | translate }}</p>
                            <p class="text-sm text-gray-400 mt-2">Using Gemini AI to structure your strategy...</p>
                        </div>
                    } @else if (businessPlan(); as plan) {
                        <div id="business-plan-content" class="animate-fade-in">
                            <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{{ 'your_business_plan' | translate }}</h2>
                                <div class="relative">
                                    <button (click)="showExportMenu.set(!showExportMenu())" class="inline-flex items-center px-4 py-2 border border-white/10 rounded-xl text-sm font-medium text-white btn-secondary-glass">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        {{ 'export_data' | translate }}
                                    </button>
                                    @if(showExportMenu()) {
                                      <div class="absolute right-0 mt-2 w-48 bg-[#0A0F1A] border border-white/10 rounded-xl shadow-xl py-1 z-10 backdrop-blur-xl">
                                          <a (click)="exportPlan('pdf')" class="cursor-pointer block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{{ 'export_format_pdf' | translate }}</a>
                                          <a (click)="exportPlan('txt')" class="cursor-pointer block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{{ 'export_format_txt' | translate }}</a>
                                          <a (click)="exportPlan('md')" class="cursor-pointer block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{{ 'export_format_md' | translate }}</a>
                                      </div>
                                    }
                                </div>
                            </div>
                            <div class="space-y-8 text-gray-300">
                                <section>
                                    <h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center">
                                        <span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3 shadow-[0_0_10px_#06b6d4]"></span>
                                        {{ 'executive_summary' | translate }}
                                    </h3>
                                    <p class="whitespace-pre-wrap leading-relaxed">{{ plan.executiveSummary }}</p>
                                </section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'company_description' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.companyDescription }}</p></section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'market_analysis' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.marketAnalysis }}</p></section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'organization_and_management' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.organizationAndManagement }}</p></section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'products_or_services' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.productsOrServices }}</p></section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'marketing_and_sales' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.marketingAndSales }}</p></section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'implementation_roadmap' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.implementationRoadmap }}</p></section>
                                <section><h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center"><span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>{{ 'key_performance_indicators' | translate }}</h3><p class="whitespace-pre-wrap leading-relaxed">{{ plan.keyPerformanceIndicators }}</p></section>
                                <section>
                                  <h3 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2 mb-3 flex items-center">
                                    <span class="w-1.5 h-6 bg-cyan-500 rounded-full mr-3 shadow-[0_0_10px_#06b6d4]"></span>
                                    {{ 'financial_plan' | translate }}
                                  </h3>
                                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="bg-white/5 p-4 rounded-xl border border-white/5"><h4 class="font-bold text-white mb-2">{{ 'startup_costs' | translate }}</h4><p class="whitespace-pre-wrap text-sm text-gray-300">{{ plan.financialPlan.startupCosts }}</p></div>
                                    <div class="bg-white/5 p-4 rounded-xl border border-white/5"><h4 class="font-bold text-white mb-2">{{ 'monthly_operating_costs' | translate }}</h4><p class="whitespace-pre-wrap text-sm text-gray-300">{{ plan.financialPlan.monthlyOperatingCosts }}</p></div>
                                    <div class="bg-white/5 p-4 rounded-xl border border-white/5"><h4 class="font-bold text-white mb-2">{{ 'revenue_projections' | translate }}</h4><p class="whitespace-pre-wrap text-sm text-gray-300">{{ plan.financialPlan.revenueProjections }}</p></div>
                                    <div class="bg-white/5 p-4 rounded-xl border border-white/5"><h4 class="font-bold text-white mb-2">{{ 'break_even_analysis' | translate }}</h4><p class="whitespace-pre-wrap text-sm text-gray-300">{{ plan.financialPlan.breakEvenAnalysis }}</p></div>
                                  </div>
                                </section>
                            </div>
                        </div>
                    } @else {
                        <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 opacity-60">
                            <svg class="w-16 h-16 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p>{{ 'business_plan_placeholder' | translate }}</p>
                        </div>
                    }
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="flex items-center justify-center h-full">
          <div class="text-center glass-card p-8 rounded-2xl max-w-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 class="text-2xl font-bold text-white mb-2">{{ 'ai_service_unavailable' | translate }}</h2>
            <p class="text-gray-400 text-sm leading-relaxed">{{ 'ai_service_unavailable_desc' | translate }}</p>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPlanComponent {
  private fb = inject(FormBuilder);
  geminiService = inject(GeminiService);
  private exportService = inject(ExportService);
  private translationService = inject(TranslationService);

  isLoading = signal(false);
  businessPlan = signal<BusinessPlan | null>(null);
  showExportMenu = signal(false);
  selectedNiche = signal<Niche | null>(null);

  niches: Niche[] = [
    { id: 'food_beverage', nameKey: 'food_and_beverage', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454A3.5 3.5 0 002 19v2h20v-2a3.5 3.5 0 00-1-2.454zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>' },
    { id: 'technology', nameKey: 'technology', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>' },
    { id: 'retail', nameKey: 'retail', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>' },
    { id: 'health_wellness', nameKey: 'health_and_wellness', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>' },
  ];

  targetAudienceOptions = [
    { value: 'young_adults_18_25', labelKey: 'audience_young_adults' },
    { value: 'adults_26_40', labelKey: 'audience_adults' },
    { value: 'professionals', labelKey: 'audience_professionals' },
    { value: 'b2b_companies', labelKey: 'audience_b2b' },
    { value: 'families', labelKey: 'audience_families' },
    { value: 'seniors', labelKey: 'audience_seniors' },
    { value: 'students', labelKey: 'audience_students' },
    { value: 'entrepreneurs', labelKey: 'audience_entrepreneurs' },
  ];

  marketingStrategyOptions = [
    { value: 'social_media', labelKey: 'strategy_social_media' },
    { value: 'digital_marketing', labelKey: 'strategy_digital_marketing' },
    { value: 'investor_pitch', labelKey: 'strategy_investor_pitch' },
    { value: 'partnerships', labelKey: 'strategy_partnerships' },
    { value: 'events_fairs', labelKey: 'strategy_events' },
    { value: 'content_marketing', labelKey: 'strategy_content' },
    { value: 'email_marketing', labelKey: 'strategy_email' },
    { value: 'influencers', labelKey: 'strategy_influencers' },
  ];

  financialProjectionOptions = [
    { value: 'up_to_10k', label: 'Até R$ 10.000' },
    { value: '10k_to_50k', label: 'R$ 10.000 - R$ 50.000' },
    { value: '50k_to_100k', label: 'R$ 50.000 - R$ 100.000' },
    { value: '100k_to_500k', label: 'R$ 100.000 - R$ 500.000' },
    { value: '500k_to_1m', label: 'R$ 500.000 - R$ 1.000.000' },
    { value: 'above_1m', label: 'Acima de R$ 1.000.000' },
  ];

  planForm = this.fb.group({
    businessName: ['', Validators.required],
    businessDescription: ['', Validators.required],
    targetAudience: ['', Validators.required],
    marketingStrategy: ['', Validators.required],
    financialProjections: ['', Validators.required],
    language: ['English', Validators.required],
  });

  selectNiche(niche: Niche) {
    this.selectedNiche.set(niche);
    this.businessPlan.set(null);
  }

  async generatePlan() {
    if (this.planForm.invalid || !this.selectedNiche()) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.businessPlan.set(null);

    const {
      businessName,
      businessDescription,
      targetAudience,
      marketingStrategy,
      financialProjections,
      language
    } = this.planForm.value;

    const nicheName = this.translationService.translate()(this.selectedNiche()!.nameKey);

    const result = await this.geminiService.generateBusinessPlan(
      nicheName,
      businessName!,
      businessDescription!,
      targetAudience!,
      marketingStrategy!,
      financialProjections!,
      language!
    );

    if (result) {
      this.businessPlan.set(result);
    } else {
      // Handle error case, maybe show a toast message
      console.error("Failed to generate business plan.");
    }

    this.isLoading.set(false);
  }

  exportPlan(format: 'pdf' | 'txt' | 'md') {
    const plan = this.businessPlan();
    const name = this.planForm.value.businessName;
    if (plan && name) {
      this.exportService.exportBusinessPlan(plan, name, format);
    }
    this.showExportMenu.set(false);
  }
}