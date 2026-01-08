import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { GeminiService } from '../../services/gemini.service';
import { CurrencyService } from '../../services/currency.service';
import { DynamicCurrencyPipe } from '../../pipes/dynamic-currency.pipe';
import { ExportService } from '../../services/pdf-export.service';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';

interface Tool {
  id: 'tax' | 'profitability' | 'budget' | 'investment' | 'annual_salary';
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

@Component({
  selector: 'app-tax-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, DynamicCurrencyPipe, CurrencyMaskDirective],
  template: `
    <div>
      @if (geminiService.isInitialized()) {
        <div class="text-center max-w-2xl mx-auto">
          <h2 class="text-3xl font-bold text-white">{{ 'smart_tools' | translate }}</h2>
          <p class="mt-2 text-lg text-gray-400">{{ 'smart_tools_desc' | translate }}</p>
        </div>

        <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          @for(tool of tools; track tool.id) {
            <button (click)="openToolModal(tool)" class="text-left p-6 glass-content hover:bg-white/5 hover:border-cyan-500/50 transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-cyan-500 group">
              <div class="flex items-center">
                <div class="smart-tool-icon flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:text-cyan-300 transition-colors" [ngClass]="'icon-' + tool.id.replace('_', '-')" [innerHTML]="getSafeIcon(tool.icon)"></div>
                <h3 class="ml-4 text-lg font-semibold text-white">{{ tool.titleKey | translate }}</h3>
              </div>
              <p class="mt-2 text-sm text-gray-400">{{ tool.descriptionKey | translate }}</p>
            </button>
          }
        </div>
      } @else {
        <div class="flex items-center justify-center h-full mt-10">
          <div class="text-center glass-content p-8 max-w-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 class="mt-4 text-2xl font-bold text-white">{{ 'ai_service_unavailable' | translate }}</h2>
            <p class="mt-2 text-gray-400">{{ 'ai_service_unavailable_desc' | translate }}</p>
          </div>
        </div>
      }
    </div>
    
    <!-- Tool Modal -->
    @if (isModalOpen() && selectedTool(); as tool) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in" (click)="closeModal()">
        <!-- Using glass-content for the modal body -->
        <div class="glass-content w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="p-6 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                <h3 class="text-xl font-bold text-white">{{ tool.titleKey | translate }}</h3>
                <div class="flex items-center gap-2">
                  @if (currentResults()) {
                    <div class="relative">
                        <button (click)="showExportMenu.set(!showExportMenu())" class="inline-flex items-center px-3 py-1.5 border border-white/10 rounded-lg shadow-sm text-xs font-medium text-white btn-secondary-glass">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          {{ 'export_data' | translate }}
                        </button>
                        @if(showExportMenu()) {
                          <div class="absolute right-0 mt-2 w-48 bg-[#0A0F1A] border border-white/10 rounded-xl shadow-xl py-1 z-20 backdrop-blur-xl">
                              <a (click)="exportResults('pdf')" class="cursor-pointer block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{{ 'export_format_pdf' | translate }}</a>
                              <a (click)="exportResults('txt')" class="cursor-pointer block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{{ 'export_format_txt' | translate }}</a>
                              <a (click)="exportResults('md')" class="cursor-pointer block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{{ 'export_format_md' | translate }}</a>
                          </div>
                        }
                    </div>
                  }
                  <button (click)="closeModal()" class="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
            </div>

            <!-- Body -->
            <div class="p-6 flex-grow overflow-y-auto custom-scrollbar relative">
              @if (!currentResults()) {
                 <!-- Language Selector (for AI tools) -->
                @if (tool.id !== 'annual_salary') {
                  <div class="mb-6">
                    <label for="toolLanguage" class="block text-sm font-bold text-white mb-1.5">{{ 'insights_language' | translate }}</label>
                    <select id="toolLanguage" [formControl]="languageControl" class="clyro-select clyro-input">
                        <option value="English">English</option>
                        <option value="Portuguese">Português</option>
                        <option value="Spanish">Español</option>
                    </select>
                  </div>
                }
                 <!-- Form Section -->
                <form [formGroup]="getFormForTool(tool.id)!" (ngSubmit)="onSubmit()">
                    @switch (tool.id) {
                      @case ('tax') {
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-bold text-white mb-1.5">{{'country' | translate}}</label>
                                <select formControlName="country" class="clyro-select clyro-input">
                                    <option value="usa">{{'usa' | translate}}</option>
                                    <option value="brazil">{{'brazil' | translate}}</option>
                                </select>
                            </div>
                             <div>
                                <label class="block text-sm font-bold text-white mb-1.5">{{'marital_status' | translate}}</label>
                                <select formControlName="maritalStatus" class="clyro-select clyro-input">
                                    <option value="single">{{'single' | translate}}</option>
                                    <option value="married_jointly">{{'married_jointly' | translate}}</option>
                                </select>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-bold text-white mb-1.5">{{'total_annual_salary' | translate}}</label>
                                <input type="text" inputmode="numeric" formControlName="salary" class="clyro-input" appCurrencyMask>
                                <p class="text-xs text-gray-400 mt-1">{{ 'total_annual_salary_desc' | translate }}</p>
                            </div>
                             <div>
                                <label class="block text-sm font-bold text-white mb-1.5">{{'freelance_income' | translate}}</label>
                                <input type="text" inputmode="numeric" formControlName="freelanceIncome" class="clyro-input" appCurrencyMask>
                                <p class="text-xs text-gray-400 mt-1">{{ 'freelance_income_desc' | translate }}</p>
                            </div>
                             <div>
                                <label class="block text-sm font-bold text-white mb-1.5">{{'investment_gains' | translate}}</label>
                                <input type="text" inputmode="numeric" formControlName="investmentGains" class="clyro-input" appCurrencyMask>
                                <p class="text-xs text-gray-400 mt-1">{{ 'investment_gains_desc' | translate }}</p>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-bold text-white mb-1.5">{{'retirement_contributions' | translate}}</label>
                                <input type="text" inputmode="numeric" formControlName="deductions" class="clyro-input" appCurrencyMask>
                                <p class="text-xs text-gray-400 mt-1">{{ 'retirement_contributions_desc' | translate }}</p>
                            </div>
                        </div>
                      }
                      @case ('profitability') {
                        <div class="space-y-6">
                           <div>
                              <label class="block text-sm font-bold text-white mb-1.5">{{'total_monthly_revenue' | translate}}</label>
                              <input type="text" inputmode="numeric" formControlName="revenue" class="clyro-input" appCurrencyMask>
                              <p class="text-xs text-gray-400 mt-1">{{ 'total_monthly_revenue_desc' | translate }}</p>
                           </div>
                           <div>
                              <label class="block text-sm font-bold text-white mb-1.5">{{'cost_of_goods_sold' | translate}}</label>
                              <input type="text" inputmode="numeric" formControlName="cogs" class="clyro-input" appCurrencyMask>
                              <p class="text-xs text-gray-400 mt-1">{{ 'cost_of_goods_sold_desc' | translate }}</p>
                           </div>
                           <div>
                              <label class="block text-sm font-bold text-white mb-1.5">{{'monthly_operating_expenses' | translate}}</label>
                              <input type="text" inputmode="numeric" formControlName="expenses" class="clyro-input" appCurrencyMask>
                              <p class="text-xs text-gray-400 mt-1">{{ 'monthly_operating_expenses_desc' | translate }}</p>
                           </div>
                        </div>
                      }
                      @case ('budget') {
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div class="sm:col-span-2"><label class="block text-sm font-bold text-white mb-1.5">{{'total_monthly_income' | translate}}</label><input type="text" inputmode="numeric" formControlName="income" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'total_monthly_income_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'housing_costs' | translate}}</label><input type="text" inputmode="numeric" formControlName="housing" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'housing_costs_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'transportation_costs' | translate}}</label><input type="text" inputmode="numeric" formControlName="transportation" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'transportation_costs_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'food_groceries' | translate}}</label><input type="text" inputmode="numeric" formControlName="food" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'food_groceries_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'entertainment_leisure' | translate}}</label><input type="text" inputmode="numeric" formControlName="entertainment" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'entertainment_leisure_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'savings_investments' | translate}}</label><input type="text" inputmode="numeric" formControlName="savings" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'savings_investments_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'other_expenses' | translate}}</label><input type="text" inputmode="numeric" formControlName="other" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'other_expenses_desc' | translate }}</p></div>
                        </div>
                      }
                      @case ('investment') {
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'initial_investment' | translate}}</label><input type="text" inputmode="numeric" formControlName="initial" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'initial_investment_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'monthly_contribution' | translate}}</label><input type="text" inputmode="numeric" formControlName="monthly" class="clyro-input" appCurrencyMask><p class="text-xs text-gray-400 mt-1">{{ 'monthly_contribution_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'annual_interest_rate' | translate}}</label><input type="number" formControlName="rate" class="clyro-input"><p class="text-xs text-gray-400 mt-1">{{ 'annual_interest_rate_desc' | translate }}</p></div>
                            <div><label class="block text-sm font-bold text-white mb-1.5">{{'investment_period_years' | translate}}</label><input type="number" formControlName="years" class="clyro-input"><p class="text-xs text-gray-400 mt-1">{{ 'investment_period_years_desc' | translate }}</p></div>
                        </div>
                      }
                      @case ('annual_salary') {
                        <div class="space-y-6">
                          <div>
                            <label class="block text-sm font-bold text-white mb-1.5">{{'monthly_income' | translate}}</label>
                            <input type="text" inputmode="numeric" formControlName="monthlyIncome" class="clyro-input" appCurrencyMask>
                            <p class="text-xs text-gray-400 mt-1">{{ 'monthly_income_desc' | translate }}</p>
                          </div>
                        </div>
                      }
                    }
                </form>
              } @else {
                <!-- Results Section -->
                <div>
                    @switch (tool.id) {
                      @case ('tax') {
                        @if(currentResults(); as results) {
                          <div class="space-y-4">
                            <div><h4 class="text-lg font-semibold text-cyan-400">{{'estimated_tax_liability' | translate}}</h4><p class="mt-1 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5">{{results.taxLiability}}</p></div>
                            <div><h4 class="text-lg font-semibold text-cyan-400">{{'potential_deductions' | translate}}</h4><ul class="mt-1 list-disc list-inside space-y-1 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5">@for(item of results.potentialDeductions; track item){<li>{{item}}</li>}</ul></div>
                            <div><h4 class="text-lg font-semibold text-cyan-400">{{'tax_saving_tips' | translate}}</h4><ul class="mt-1 list-disc list-inside space-y-1 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5">@for(item of results.taxSavingTips; track item){<li>{{item}}</li>}</ul></div>
                            <div class="mt-4 p-4 bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-200 text-sm rounded-r-xl"><p class="font-bold">{{'disclaimer' | translate}}</p><p>{{'tax_disclaimer' | translate}}</p></div>
                          </div>
                        }
                      }
                      @case ('profitability') {
                        @if(currentResults(); as results) {
                           <div class="space-y-6">
                              <h4 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">{{'analysis_results' | translate}}</h4>
                              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                  <div class="bg-white/5 p-4 rounded-xl border border-white/5"><p class="text-sm text-gray-400">{{'gross_profit' | translate}}</p><p class="text-xl font-bold text-white">{{results.grossProfit | dynamicCurrency: true}}</p></div>
                                  <div class="bg-white/5 p-4 rounded-xl border border-white/5"><p class="text-sm text-gray-400">{{'operating_profit' | translate}}</p><p class="text-xl font-bold text-white">{{results.operatingProfit | dynamicCurrency: true}}</p></div>
                                  <div class="bg-white/5 p-4 rounded-xl border border-white/5"><p class="text-sm text-gray-400">{{'net_profit_margin' | translate}}</p><p class="text-xl font-bold text-white">{{results.netProfitMargin | number:'1.2-2'}}%</p></div>
                              </div>
                              <h4 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">{{'ai_powered_insights' | translate}}</h4>
                              <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">{{results.insights}}</p>
                           </div>
                        }
                      }
                       @case ('budget') {
                        @if(currentResults(); as results) {
                           <div class="space-y-6">
                              <h4 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">{{'budget_summary' | translate}}</h4>
                               <div class="bg-white/5 p-4 rounded-xl text-center border border-white/5"><p class="text-sm text-gray-400">{{'remaining_funds' | translate}}</p><p class="text-3xl font-bold mt-1" [class]="results.remaining >= 0 ? 'text-green-400' : 'text-red-400'">{{results.remaining | dynamicCurrency: true}}</p></div>
                              <h4 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">{{'ai_powered_insights' | translate}}</h4>
                              <p class="text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">{{results.analysis}}</p>
                              <ul class="list-disc list-inside space-y-2 text-gray-300 pl-2">@for(item of results.recommendations; track item){<li>{{item}}</li>}</ul>
                           </div>
                        }
                      }
                      @case ('investment') {
                        @if(currentResults(); as results) {
                           <div class="space-y-6">
                              <h4 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">{{'analysis_results' | translate}}</h4>
                              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                  <div class="bg-white/5 p-4 rounded-xl border border-white/5"><p class="text-sm text-gray-400">{{'projected_future_value' | translate}}</p><p class="text-2xl font-bold text-green-400 mt-1">{{results.futureValue | dynamicCurrency: true}}</p></div>
                                  <div class="bg-white/5 p-4 rounded-xl border border-white/5"><p class="text-sm text-gray-400">{{'total_contributions' | translate}}</p><p class="text-xl font-bold text-white mt-1">{{results.totalContributions | dynamicCurrency: true}}</p></div>
                                  <div class="bg-white/5 p-4 rounded-xl border border-white/5"><p class="text-sm text-gray-400">{{'total_interest_earned' | translate}}</p><p class="text-xl font-bold text-white mt-1">{{results.totalInterest | dynamicCurrency: true}}</p></div>
                              </div>
                              <h4 class="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">{{'ai_powered_insights' | translate}}</h4>
                              <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">{{results.insights}}</p>
                           </div>
                        }
                      }
                      @case ('annual_salary') {
                        @if(currentResults(); as results) {
                          <div class="space-y-6 text-center">
                              <div class="bg-white/5 p-6 rounded-xl border border-white/10">
                                  <p class="text-sm text-gray-400 uppercase tracking-wider">{{'monthly_income' | translate}}</p>
                                  <p class="text-2xl font-bold text-white mt-1">{{results.monthlyIncome | dynamicCurrency: true}}</p>
                              </div>
                              <div class="bg-green-500/10 p-8 rounded-xl border border-green-500/20">
                                  <p class="text-sm text-green-300 uppercase tracking-wider">{{'calculated_annual_salary' | translate}}</p>
                                  <p class="text-4xl font-bold text-green-400 mt-2">{{results.annualSalary | dynamicCurrency: true}}</p>
                              </div>
                          </div>
                        }
                      }
                    }
                </div>
              }
              @if (isLoading()) {
                <div class="absolute inset-0 bg-[#0A0F1A]/90 backdrop-blur-sm flex items-center justify-center rounded-b-2xl z-30">
                    <div class="text-center">
                        <div class="relative w-16 h-16 mx-auto mb-4">
                            <div class="absolute inset-0 rounded-full border-4 border-white/10"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                        </div>
                        <p class="text-lg font-medium text-white">{{'running_analysis' | translate}}</p>
                    </div>
                </div>
              }
            </div>
            
            <!-- Footer -->
            <div class="px-6 py-4 rounded-b-2xl flex justify-end items-center space-x-4 flex-shrink-0 border-t border-white/10">
               @if(currentResults()) {
                 <button (click)="currentResults.set(null)" class="px-4 py-2 text-sm font-semibold rounded-xl transition hover:bg-white/10 text-white border border-transparent hover:border-white/10">{{ 'back' | translate }}</button>
               }
                <button 
                  (click)="onSubmit()"
                  [disabled]="getFormForTool(tool.id)!.invalid || isLoading() || !!currentResults()"
                  class="px-6 py-2 text-sm font-bold rounded-xl transition btn-primary-gradient text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                  {{ 'run_analysis' | translate }}
                </button>
            </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxCalculatorComponent {
  // ... existing component logic remains unchanged ...
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  geminiService = inject(GeminiService);
  private exportService = inject(ExportService);
  private currencyService = inject(CurrencyService);

  isModalOpen = signal(false);
  selectedTool = signal<Tool | null>(null);
  isLoading = signal(false);
  currentResults = signal<any | null>(null);
  showExportMenu = signal(false);

  taxForm = this.fb.group({
    country: ['usa', Validators.required],
    maritalStatus: ['single', Validators.required],
    salary: [60000, Validators.required],
    freelanceIncome: [15000],
    investmentGains: [5000],
    deductions: [13850, Validators.required]
  });

  profitabilityForm = this.fb.group({
    revenue: [10000, Validators.required],
    cogs: [4000, Validators.required],
    expenses: [2500, Validators.required]
  });

  budgetForm = this.fb.group({
    income: [5000, Validators.required],
    housing: [1500, Validators.required],
    transportation: [400, Validators.required],
    food: [600, Validators.required],
    entertainment: [300, Validators.required],
    savings: [1000, Validators.required],
    other: [200, Validators.required]
  });

  investmentForm = this.fb.group({
    initial: [1000, Validators.required],
    monthly: [200, Validators.required],
    rate: [7, Validators.required],
    years: [10, Validators.required]
  });

  annualSalaryForm = this.fb.group({
    monthlyIncome: [5000, [Validators.required, Validators.min(0)]]
  });

  languageControl = new FormControl('English', Validators.required);

  tools: Tool[] = [
    { id: 'tax', titleKey: 'detailed_tax_analysis', descriptionKey: 'detailed_tax_analysis_desc', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 14l-6-6m5.5.5h.01M5 14l6-6m-5.5 5.5h.01" /></svg>' },
    { id: 'profitability', titleKey: 'business_profitability_calculator', descriptionKey: 'business_profitability_calculator_desc', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>' },
    { id: 'budget', titleKey: 'personal_budget_planner', descriptionKey: 'personal_budget_planner_desc', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>' },
    { id: 'investment', titleKey: 'investment_return_calculator', descriptionKey: 'investment_return_calculator_desc', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>' },
    { id: 'annual_salary', titleKey: 'annual_salary_calculator', descriptionKey: 'annual_salary_calculator_desc', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 11c-1.333 0-2.5.8-2.5 2s1.167 2 2.5 2 2.5-.8 2.5-2-.25-2-2.5-2zM12 11V9" /></svg>' },
  ];

  getFormForTool(toolId: string): FormGroup {
    switch (toolId) {
      case 'tax': return this.taxForm;
      case 'profitability': return this.profitabilityForm;
      case 'budget': return this.budgetForm;
      case 'investment': return this.investmentForm;
      case 'annual_salary': return this.annualSalaryForm;
      default: throw new Error('Invalid tool ID');
    }
  }

  getSafeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  openToolModal(tool: Tool) {
    this.selectedTool.set(tool);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedTool.set(null);
    this.currentResults.set(null);
    this.showExportMenu.set(false);
  }

  async onSubmit() {
    const tool = this.selectedTool();
    if (!tool) return;

    const form = this.getFormForTool(tool.id);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    let result: any = null;
    const language = this.languageControl.value ?? 'English';

    switch (tool.id) {
      case 'tax':
        result = await this.geminiService.getDetailedTaxAnalysis(form.value, language);
        break;
      case 'profitability':
        {
          const { revenue, cogs, expenses } = form.value;
          const grossProfit = revenue - cogs;
          const operatingProfit = grossProfit - expenses;
          const netProfitMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
          const insights = await this.geminiService.getBusinessProfitabilityInsights({ ...form.value, grossProfit, operatingProfit, netProfitMargin }, language);
          result = { grossProfit, operatingProfit, netProfitMargin, ...insights };
        }
        break;
      case 'budget':
        {
          const { income, housing, transportation, food, entertainment, savings, other } = form.value;
          const totalExpenses = housing + transportation + food + entertainment + savings + other;
          const remaining = income - totalExpenses;
          const advice = await this.geminiService.getPersonalBudgetAdvice({ ...form.value, remaining }, language);
          result = { remaining, ...advice };
        }
        break;
      case 'investment':
        {
          const { initial, monthly, rate, years } = form.value;
          const monthlyRate = rate / 100 / 12;
          const months = years * 12;

          let futureValue = initial * Math.pow(1 + monthlyRate, months);
          if (monthlyRate > 0) {
            futureValue += monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
          } else {
            futureValue += monthly * months;
          }

          const totalContributions = initial + (monthly * months);
          const totalInterest = futureValue - totalContributions;

          const insights = await this.geminiService.getInvestmentInsights({ ...form.value, futureValue }, language);
          result = { futureValue, totalContributions, totalInterest, ...insights };
        }
        break;
      case 'annual_salary':
        {
          const { monthlyIncome } = form.value;
          const annualSalary = (monthlyIncome ?? 0) * 12;
          result = { monthlyIncome, annualSalary };
          // This is a local calculation, so we can turn off the loader quickly.
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        break;
    }

    this.currentResults.set(result);
    this.isLoading.set(false);
  }

  exportResults(format: 'pdf' | 'txt' | 'md') {
    const tool = this.selectedTool();
    const results = this.currentResults();
    if (tool && results) {
      this.exportService.exportSmartToolResult(results, tool, format);
    }
    this.showExportMenu.set(false);
  }
}