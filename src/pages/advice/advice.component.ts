import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FinancialDataService } from '../../services/financial-data.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-advice',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div class="max-w-4xl mx-auto w-full text-center">
          <h1 class="text-3xl font-bold tracking-tight text-white">{{ 'advice_title' | translate }}</h1>
          <p class="mt-2 text-lg text-gray-400">
             {{ 'advice_desc' | translate }}
          </p>
      </div>

      <div class="mt-8 flex-grow max-w-4xl mx-auto w-full">
         <div class="text-center">
             <button (click)="getAdvice()" [disabled]="isLoading()" class="w-full max-w-sm flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-600">
                  @if (isLoading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  }
                  {{ (isLoading() ? 'generating_advice' : 'get_advice') | translate }}
            </button>
         </div>

         <div class="mt-8">
            @if (isLoading()) {
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <svg class="animate-spin mx-auto h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-4 text-lg text-gray-300">{{ 'generating_advice' | translate }}</p>
                    </div>
                </div>
            } @else if (advice()) {
                <div class="glass-content p-6">
                    <h2 class="text-2xl font-bold text-white mb-4">{{ 'your_advice' | translate }}</h2>
                    <div class="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">{{ advice() }}</div>
                </div>
            } @else if (clicked() && !advice()) {
                 <div class="text-center text-gray-400 mt-8">
                    <p>Enter data in the "Financial Snapshot" section to get personalized advice.</p>
                </div>
            }
         </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdviceComponent {
  private financialDataService = inject(FinancialDataService);
  private geminiService = inject(GeminiService);

  isLoading = signal(false);
  advice = signal<string | null>(null);
  clicked = signal(false); // To show message only after button click

  async getAdvice() {
    this.isLoading.set(true);
    this.advice.set(null);
    this.clicked.set(true);

    const data = this.financialDataService.financialData();
    const analysis = this.financialDataService.analysis();

    if (!analysis || (analysis.totalRevenue === 0 && analysis.totalExpenses === 0)) {
        // No data to analyze
        this.isLoading.set(false);
        return;
    }

    const fullData = { ...data, analysis };

    const result = await this.geminiService.getFinancialAdvice(fullData);
    this.advice.set(result);
    this.isLoading.set(false);
  }
}