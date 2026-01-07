import { ChangeDetectionStrategy, Component, inject, computed, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { FinancialDataService } from '../../services/financial-data.service';
import { DynamicCurrencyPipe } from '../../pipes/dynamic-currency.pipe';
import { TasksComponent } from '../../components/tasks/tasks.component';
import { DecimalPipe } from '@angular/common';
import { CurrencyService } from '../../services/currency.service';

declare const d3: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TranslatePipe, DynamicCurrencyPipe, TasksComponent, DecimalPipe],
  template: `
    <div class="p-2 sm:p-4 lg:p-6 h-full flex flex-col">
        <!-- Header -->
        <div class="max-w-7xl mx-auto w-full mb-6 sm:mb-8 text-center sm:text-left">
            <!-- Adjusted typography: smaller on mobile (text-2xl), larger on desktop (text-4xl) -->
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              {{ 'welcome_back' | translate: { name: greetingName() } }}
            </h1>
            <p class="mt-2 text-sm sm:text-base lg:text-lg text-[#7AA5E8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] max-w-2xl">
              {{ 'dashboard_subtitle' | translate }}
            </p>
        </div>

        <!-- Stats Cards -->
        <div data-tour-id="dashboard-cards" class="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto w-full">
            <!-- Total Revenue (Green Luminous Glass) -->
            <div class="glass-card p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-br hover:from-green-500/20 hover:via-green-500/5 hover:to-transparent hover:border-green-400/50 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] hover:-translate-y-1">
                <div class="flex items-center justify-between mb-4 relative z-10">
                    <h3 class="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-green-300 transition-colors duration-300 uppercase tracking-wider">{{ 'total_revenue' | translate }}</h3>
                    <div class="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 group-hover:text-green-300 transition-colors duration-300 border border-green-500/20 group-hover:border-green-400/50 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                        <svg class="h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                        </svg>
                    </div>
                </div>
                <div class="relative z-10">
                    <span class="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-green-50 transition-colors drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">{{ totalRevenue() | dynamicCurrency }}</span>
                </div>
                <!-- Decorator Blob -->
                <div class="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/30 transition-colors duration-500"></div>
            </div>

            <!-- Total Expenses (Red Luminous Glass) -->
            <div class="glass-card p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-br hover:from-red-500/20 hover:via-red-500/5 hover:to-transparent hover:border-red-400/50 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] hover:-translate-y-1">
                <div class="flex items-center justify-between mb-4 relative z-10">
                    <h3 class="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-red-300 transition-colors duration-300 uppercase tracking-wider">{{ 'total_expenses' | translate }}</h3>
                    <div class="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300 transition-colors duration-300 border border-red-500/20 group-hover:border-red-400/50 group-hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                        <svg class="h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                    </div>
                </div>
                <div class="relative z-10">
                    <span class="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-red-50 transition-colors drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">{{ totalExpenses() | dynamicCurrency }}</span>
                </div>
                <!-- Decorator Blob -->
                <div class="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/30 transition-colors duration-500"></div>
            </div>

            <!-- Net Balance (Blue Luminous Glass) -->
            <div class="glass-card p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500/20 hover:via-blue-500/5 hover:to-transparent hover:border-blue-400/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] hover:-translate-y-1">
                <div class="absolute top-0 right-0 w-24 h-24 bg-[#1E90FF]/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#1E90FF]/30 transition-all duration-500"></div>
                
                <div class="flex items-center justify-between mb-4 relative z-10">
                    <h3 class="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-blue-300 transition-colors duration-300 uppercase tracking-wider">{{ 'net_balance' | translate }}</h3>
                    <div class="p-2 rounded-lg bg-[#1E90FF]/10 text-[#1E90FF] group-hover:bg-[#1E90FF]/20 group-hover:text-white transition-colors duration-300 border border-[#1E90FF]/20 group-hover:border-blue-400/50 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                        <svg class="h-5 w-5 sm:h-6 sm:w-6" [class]="netBalance() >= 0 ? 'text-[#1E90FF] group-hover:text-white' : 'text-red-400'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 20L20 4" />
                        </svg>
                    </div>
                </div>
                <div class="relative z-10">
                    <span class="text-2xl sm:text-3xl font-bold transition-colors drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" [class]="netBalance() >= 0 ? 'text-white group-hover:text-blue-50' : 'text-red-400'">{{ netBalance() | dynamicCurrency }}</span>
                </div>
            </div>

            <!-- Profit Margin (Cyan Luminous Glass) -->
            <div class="glass-card p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:via-cyan-500/5 hover:to-transparent hover:border-cyan-400/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] hover:-translate-y-1">
                <div class="flex items-center justify-between mb-4 relative z-10">
                    <h3 class="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-cyan-300 transition-colors duration-300 uppercase tracking-wider">{{ 'profit_margin' | translate }}</h3>
                    <div class="p-2 rounded-lg bg-[#00BFFF]/10 text-[#00BFFF] group-hover:bg-[#00BFFF]/20 group-hover:text-white transition-colors duration-300 border border-[#00BFFF]/20 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                        <svg class="h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </div>
                </div>
                <div class="relative z-10">
                    @if (productMargin() !== null) {
                        <span class="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-cyan-50 transition-colors drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">{{ (productMargin()! * 100) | number:'1.2-2' }}%</span>
                    } @else {
                        <span class="text-lg text-gray-500">{{ 'n_a' | translate }}</span>
                    }
                </div>
                <!-- Decorator Blob -->
                <div class="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-[#00BFFF]/10 rounded-full blur-3xl group-hover:bg-[#00BFFF]/30 transition-colors duration-500"></div>
            </div>
        </div>

        <!-- History Chart (Subtle Blue Glow on Hover) -->
        <div class="mt-8 max-w-7xl mx-auto w-full glass-card p-4 sm:p-6 overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(30,144,255,0.1)] transition-all duration-500">
            <h3 class="text-lg sm:text-xl font-bold text-white mb-6 flex items-center">
              <span class="bg-[#1E90FF] w-1 h-6 mr-3 rounded-full shadow-[0_0_10px_#1E90FF]"></span>
              {{ 'financial_overview_history' | translate }}
            </h3>
            <div class="relative h-64 sm:h-80 w-full" #chartContainer></div>
        </div>

        <!-- Main Content Area -->
        <div class="mt-8 flex-grow max-w-7xl mx-auto w-full">
          <app-tasks></app-tasks>
        </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  authService = inject(AuthService);
  financialDataService = inject(FinancialDataService);
  currencyService = inject(CurrencyService);

  @ViewChild('chartContainer') chartContainer!: ElementRef;

  user = this.authService.user;
  analysis = this.financialDataService.analysis;

  netBalance = computed(() => this.analysis()?.netBalance ?? 0);
  totalRevenue = computed(() => this.analysis()?.totalRevenue ?? 0);
  totalExpenses = computed(() => this.analysis()?.totalExpenses ?? 0);
  productMargin = computed(() => this.analysis()?.productMargin ?? null);
  
  greetingName = computed(() => this.user()?.name.split(' ')[0] || 'User');

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      // Re-render chart when data or currency changes
      this.analysis(); 
      this.currencyService.selectedCurrency();
      setTimeout(() => this.renderChart(), 100);
    });
  }

  ngAfterViewInit() {
    this.renderChart();
    
    // Make chart responsive
    this.resizeObserver = new ResizeObserver(() => {
      this.renderChart();
    });
    if (this.chartContainer?.nativeElement) {
      this.resizeObserver.observe(this.chartContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  renderChart() {
    if (!this.chartContainer || !this.analysis()) return;

    const element = this.chartContainer.nativeElement;
    // Clear previous chart
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Generate mock history data based on current snapshot
    const currentRev = this.totalRevenue();
    const currentExp = this.totalExpenses();
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']; // Ideally dynamic
    
    for (let i = 0; i < 6; i++) {
        const isLast = i === 5;
        // Random variance between 0.8 and 1.2 for past months
        const variance = isLast ? 1 : 0.8 + Math.random() * 0.4;
        data.push({
            month: months[i],
            revenue: currentRev * variance,
            expenses: currentExp * variance
        });
    }

    // Convert values to user's selected currency for display
    data.forEach(d => {
        d.revenue = this.currencyService.convert(d.revenue);
        d.expenses = this.currencyService.convert(d.expenses);
    });

    // Scales
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map((d: any) => d.month))
      .padding(0.1); // Used for positioning points

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: any) => Math.max(d.revenue, d.expenses)) * 1.1])
      .range([height, 0]);

    // Defs for Gradients
    const defs = svg.append('defs');

    // Revenue Gradient (Neon Blue)
    const revenueGradient = defs.append('linearGradient')
      .attr('id', 'revenueGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    revenueGradient.append('stop').attr('offset', '0%').attr('stop-color', '#1E90FF').attr('stop-opacity', 0.6);
    revenueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#1E90FF').attr('stop-opacity', 0);

    // Expenses Gradient (Neon Purple/Pink)
    const expenseGradient = defs.append('linearGradient')
      .attr('id', 'expenseGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    expenseGradient.append('stop').attr('offset', '0%').attr('stop-color', '#F472B6').attr('stop-opacity', 0.6);
    expenseGradient.append('stop').attr('offset', '100%').attr('stop-color', '#F472B6').attr('stop-opacity', 0);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .attr('color', '#94A3B8') // Slate-400
      .select('.domain').remove();

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d: number) => this.currencyService.format(d, { notation: 'compact' })))
      .attr('color', '#94A3B8')
      .select('.domain').remove();

    // Grid lines (Horizontal only)
    svg.selectAll('line.horizontalGrid').data(y.ticks(5)).enter()
      .append('line')
      .attr('class', 'horizontalGrid')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d: any) => y(d))
      .attr('y2', (d: any) => y(d))
      .attr('stroke', 'white')
      .attr('stroke-opacity', 0.05)
      .attr('stroke-width', 1);

    // Generators
    const areaRevenue = d3.area()
      .x((d: any) => x(d.month)! + x.bandwidth() / 2)
      .y0(height)
      .y1((d: any) => y(d.revenue))
      .curve(d3.curveMonotoneX);

    const lineRevenue = d3.line()
      .x((d: any) => x(d.month)! + x.bandwidth() / 2)
      .y((d: any) => y(d.revenue))
      .curve(d3.curveMonotoneX);

    const areaExpenses = d3.area()
      .x((d: any) => x(d.month)! + x.bandwidth() / 2)
      .y0(height)
      .y1((d: any) => y(d.expenses))
      .curve(d3.curveMonotoneX);

    const lineExpenses = d3.line()
      .x((d: any) => x(d.month)! + x.bandwidth() / 2)
      .y((d: any) => y(d.expenses))
      .curve(d3.curveMonotoneX);

    // Draw Areas
    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#revenueGradient)')
      .attr('d', areaRevenue);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#expenseGradient)')
      .attr('d', areaExpenses);

    // Draw Lines
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#1E90FF')
      .attr('stroke-width', 3)
      .attr('d', lineRevenue)
      .attr('filter', 'drop-shadow(0px 0px 8px rgba(30, 144, 255, 0.5))'); // Neon glow

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#F472B6') // Pink-400
      .attr('stroke-width', 3)
      .attr('d', lineExpenses)
      .attr('filter', 'drop-shadow(0px 0px 8px rgba(244, 114, 182, 0.5))'); // Neon glow

    // Interactive Dots (Revenue)
    svg.selectAll('.dot-revenue')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot-revenue')
      .attr('cx', (d: any) => x(d.month)! + x.bandwidth() / 2)
      .attr('cy', (d: any) => y(d.revenue))
      .attr('r', 5)
      .attr('fill', '#0A0F1A')
      .attr('stroke', '#1E90FF')
      .attr('stroke-width', 2);

    // Interactive Dots (Expenses)
    svg.selectAll('.dot-expense')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot-expense')
      .attr('cx', (d: any) => x(d.month)! + x.bandwidth() / 2)
      .attr('cy', (d: any) => y(d.expenses))
      .attr('r', 5)
      .attr('fill', '#0A0F1A')
      .attr('stroke', '#F472B6')
      .attr('stroke-width', 2);
  }
}