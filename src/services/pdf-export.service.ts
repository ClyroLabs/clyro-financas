import { Injectable, inject } from '@angular/core';
import { TranslationService } from './translation.service';
import { CurrencyService } from './currency.service';
import { FinancialAnalysis, FinancialInputs } from './financial-data.service';

// Interfaces for data structures
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

interface MarketInsights {
  marketTrends: string;
  keyStatistics: string;
  targetAudienceAnalysis: string;
  opportunities: string;
  challenges: string;
}

interface SmartTool {
  id: 'tax' | 'profitability' | 'budget' | 'investment' | 'annual_salary';
  titleKey: string;
}

type ExportFormat = 'pdf' | 'txt' | 'md';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private translationService = inject(TranslationService);
  private currencyService = inject(CurrencyService);

  // #region Private Generic Exporters
  private exportAsTxt(content: string, filename: string): void {
    this.downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename);
  }

  private exportAsMd(content: string, filename: string): void {
    this.downloadBlob(new Blob([content], { type: 'text/markdown;charset=utf-8' }), filename);
  }

  private exportAsPdf(htmlContent: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    } else {
      console.error('Could not open print window. Check browser popup settings.');
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  private getPdfStyles(): string {
    return `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 20mm; }
        h1 { color: #111; font-size: 2.2em; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #222; font-size: 1.6em; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
        h3 { color: #444; font-size: 1.2em; margin-top: 20px; }
        p, li { text-align: justify; white-space: pre-wrap; word-wrap: break-word; }
        ul { padding-left: 20px; }
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        .data-item { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .data-label { font-weight: bold; color: #555; }
        .data-value { font-size: 1.2em; }
        @media print {
          h1, h2, h3 { page-break-after: avoid; }
          section, .data-grid { page-break-inside: avoid; }
        }
      </style>
    `;
  }
  // #endregion

  // #region Business Plan
  exportBusinessPlan(plan: BusinessPlan, businessName: string, format: ExportFormat): void {
    const filename = `${businessName.replace(/\s/g, '_')}_Business_Plan.${format}`;
    if (format === 'pdf') {
      const html = this.getBusinessPlanAsHtml(plan, businessName);
      this.exportAsPdf(html);
    } else {
      const text = this.getBusinessPlanAsText(plan, format);
      format === 'txt' ? this.exportAsTxt(text, filename) : this.exportAsMd(text, filename);
    }
  }

  private getBusinessPlanAsText(plan: BusinessPlan, format: 'txt' | 'md'): string {
    const t = this.translationService.translate();
    const h2 = format === 'md' ? '##' : '';
    const h3 = format === 'md' ? '###' : '';

    const sections = [
      { title: t('executive_summary'), content: plan.executiveSummary },
      { title: t('company_description'), content: plan.companyDescription },
      { title: t('market_analysis'), content: plan.marketAnalysis },
      { title: t('organization_and_management'), content: plan.organizationAndManagement },
      { title: t('products_or_services'), content: plan.productsOrServices },
      { title: t('marketing_and_sales'), content: plan.marketingAndSales },
      { title: t('implementation_roadmap'), content: plan.implementationRoadmap },
      { title: t('key_performance_indicators'), content: plan.keyPerformanceIndicators },
    ];
    
    let content = sections.map(s => `${h2} ${s.title}\n\n${s.content}\n\n`).join('');

    // Financial Plan Section
    content += `${h2} ${t('financial_plan')}\n\n`;
    content += `${h3} ${t('startup_costs')}\n\n${plan.financialPlan.startupCosts}\n\n`;
    content += `${h3} ${t('monthly_operating_costs')}\n\n${plan.financialPlan.monthlyOperatingCosts}\n\n`;
    content += `${h3} ${t('revenue_projections')}\n\n${plan.financialPlan.revenueProjections}\n\n`;
    content += `${h3} ${t('break_even_analysis')}\n\n${plan.financialPlan.breakEvenAnalysis}\n\n`;
    
    return content;
  }

  private getBusinessPlanAsHtml(plan: BusinessPlan, businessName: string): string {
    const t = this.translationService.translate();
    const sections = [
        { title: t('executive_summary'), content: plan.executiveSummary },
        { title: t('company_description'), content: plan.companyDescription },
        { title: t('market_analysis'), content: plan.marketAnalysis },
        { title: t('organization_and_management'), content: plan.organizationAndManagement },
        { title: t('products_or_services'), content: plan.productsOrServices },
        { title: t('marketing_and_sales'), content: plan.marketingAndSales },
        { title: t('implementation_roadmap'), content: plan.implementationRoadmap },
        { title: t('key_performance_indicators'), content: plan.keyPerformanceIndicators },
    ];

    let sectionsHtml = sections
      .map(s => `<section><h2>${s.title}</h2><p>${s.content.replace(/\n/g, '<br>')}</p></section>`)
      .join('');

    // Financial Plan Section
    sectionsHtml += `<section>
        <h2>${t('financial_plan')}</h2>
        <h3>${t('startup_costs')}</h3><p>${plan.financialPlan.startupCosts.replace(/\n/g, '<br>')}</p>
        <h3>${t('monthly_operating_costs')}</h3><p>${plan.financialPlan.monthlyOperatingCosts.replace(/\n/g, '<br>')}</p>
        <h3>${t('revenue_projections')}</h3><p>${plan.financialPlan.revenueProjections.replace(/\n/g, '<br>')}</p>
        <h3>${t('break_even_analysis')}</h3><p>${plan.financialPlan.breakEvenAnalysis.replace(/\n/g, '<br>')}</p>
    </section>`;
      
    return `<html><head><title>${businessName}</title>${this.getPdfStyles()}</head><body><h1>${businessName}</h1>${sectionsHtml}</body></html>`;
  }
  // #endregion

  // #region Market Insights
  exportMarketInsights(insights: MarketInsights, nicheName: string, format: ExportFormat): void {
    const filename = `Market_Insights_${nicheName.replace(/\s/g, '_')}.${format}`;
    if (format === 'pdf') {
      const html = this.getMarketInsightsAsHtml(insights, nicheName);
      this.exportAsPdf(html);
    } else {
      const text = this.formatSections(this.getMarketInsightsSections(insights), format);
      format === 'txt' ? this.exportAsTxt(text, filename) : this.exportAsMd(text, filename);
    }
  }
  
  private getMarketInsightsSections(insights: MarketInsights) {
    const t = this.translationService.translate();
    return [
        { title: t('market_trends'), content: insights.marketTrends },
        { title: t('key_statistics'), content: insights.keyStatistics },
        { title: t('target_audience_analysis'), content: insights.targetAudienceAnalysis },
        { title: t('opportunities'), content: insights.opportunities },
        { title: t('challenges'), content: insights.challenges },
    ];
  }

  private getMarketInsightsAsHtml(insights: MarketInsights, nicheName: string): string {
      const t = this.translationService.translate();
      const title = t('your_market_insights_for', { niche: nicheName });
      const sections = this.getMarketInsightsSections(insights)
        .map(s => `<section><h2>${s.title}</h2><p>${s.content.replace(/\n/g, '<br>')}</p></section>`)
        .join('');
      return `<html><head><title>${title}</title>${this.getPdfStyles()}</head><body><h1>${title}</h1>${sections}</body></html>`;
  }
  // #endregion

  // #region Financial Analysis
  exportFinancialAnalysis(analysis: FinancialAnalysis, inputs: FinancialInputs, format: ExportFormat): void {
      const t = this.translationService.translate();
      const filename = `${t('financial_analysis')}.${format}`;
      if (format === 'pdf') {
          const html = this.getFinancialAnalysisAsHtml(analysis, inputs);
          this.exportAsPdf(html);
      } else {
          const text = this.getFinancialAnalysisAsText(analysis, inputs, format);
          format === 'txt' ? this.exportAsTxt(text, filename) : this.exportAsMd(text, filename);
      }
  }

  private formatCurrency(valueInUsd: number): string {
    return this.currencyService.format(this.currencyService.convert(valueInUsd));
  }

  private getFinancialAnalysisAsText(analysis: FinancialAnalysis, inputs: FinancialInputs, format: 'txt' | 'md'): string {
      const t = this.translationService.translate();
      const h = format === 'md' ? '##' : '';
      const b = format === 'md' ? '**' : '';
      const li = format === 'md' ? '* ' : '- ';

      let content = `${h} ${t('financial_analysis')}\n\n`;
      content += `${b}${t('net_balance')}:${b} ${this.formatCurrency(analysis.netBalance)}\n`;
      content += `${b}${t('profit_margin')}:${b} ${analysis.productMargin !== null ? (analysis.productMargin * 100).toFixed(2) + '%' : t('no_margin_data')}\n`;
      if (analysis.inflationAdjustment !== null && analysis.inflationAdjustment > 0) {
          content += `${b}${t('inflation_recommendation')}:${b} ${t('increase_price_by', { amount: this.formatCurrency(analysis.inflationAdjustment) })}\n`;
      }
      content += `\n${h} ${t('data_inputs')}\n`;
      content += `${li}${t('fixed_revenue')}: ${this.formatCurrency(inputs.fixedRevenue ?? 0)}\n`;
      content += `${li}${t('sporadic_revenue')}: ${this.formatCurrency(inputs.sporadicRevenue ?? 0)}\n`;
      content += `${li}${t('fixed_expenses')}: ${this.formatCurrency(inputs.fixedExpenses ?? 0)}\n`;
      content += `${li}${t('unforeseen_expenses')}: ${this.formatCurrency(inputs.unforeseenExpenses ?? 0)}\n`;
      content += `${li}${t('personal_spending')}: ${this.formatCurrency(inputs.personalSpending ?? 0)}\n`;
      content += `${li}${t('product_cost')}: ${this.formatCurrency(inputs.productCost ?? 0)}\n`;
      content += `${li}${t('sale_price')}: ${this.formatCurrency(inputs.salePrice ?? 0)}\n`;
      return content;
  }

  private getFinancialAnalysisAsHtml(analysis: FinancialAnalysis, inputs: FinancialInputs): string {
      const t = this.translationService.translate();
      const title = t('financial_analysis');
      let body = `<h1>${title}</h1>`;
      body += `<div class="data-grid">
          <div class="data-item"><span class="data-label">${t('net_balance')}:</span><br><span class="data-value">${this.formatCurrency(analysis.netBalance)}</span></div>
          <div class="data-item"><span class="data-label">${t('profit_margin')}:</span><br><span class="data-value">${analysis.productMargin !== null ? (analysis.productMargin * 100).toFixed(2) + '%' : t('no_margin_data')}</span></div>
      </div>`;
      if (analysis.inflationAdjustment !== null && analysis.inflationAdjustment > 0) {
        body += `<h2>${t('inflation_recommendation')}</h2><p>${t('increase_price_by', { amount: this.formatCurrency(analysis.inflationAdjustment) })}</p>`;
      }
      return `<html><head><title>${title}</title>${this.getPdfStyles()}</head><body>${body}</body></html>`;
  }
  // #endregion

  // #region Smart Tool
  exportSmartToolResult(result: any, tool: SmartTool, format: ExportFormat): void {
      const t = this.translationService.translate();
      const filename = `${t(tool.titleKey).replace(/\s/g, '_')}_Analysis.${format}`;
      if (format === 'pdf') {
          const html = this.getSmartToolResultAsHtml(result, tool);
          this.exportAsPdf(html);
      } else {
          const text = this.getSmartToolResultAsText(result, tool, format);
          format === 'txt' ? this.exportAsTxt(text, filename) : this.exportAsMd(text, filename);
      }
  }

  private getSmartToolResultAsText(result: any, tool: SmartTool, format: 'txt' | 'md'): string {
      const t = this.translationService.translate();
      const h = format === 'md' ? '## ' : '';
      const b = format === 'md' ? '**' : '';
      const li = format === 'md' ? '* ' : '- ';
      let content = `${h}${t(tool.titleKey)}\n\n`;

      switch (tool.id) {
          case 'tax':
              content += `${b}${t('estimated_tax_liability')}:${b}\n${result.taxLiability}\n\n`;
              content += `${b}${t('potential_deductions')}:${b}\n${result.potentialDeductions.map((i: string) => li + i).join('\n')}\n\n`;
              content += `${b}${t('tax_saving_tips')}:${b}\n${result.taxSavingTips.map((i: string) => li + i).join('\n')}\n`;
              break;
          case 'profitability':
              content += `${b}${t('gross_profit')}:${b} ${this.currencyService.format(result.grossProfit)}\n`;
              content += `${b}${t('operating_profit')}:${b} ${this.currencyService.format(result.operatingProfit)}\n`;
              content += `${b}${t('net_profit_margin')}:${b} ${result.netProfitMargin.toFixed(2)}%\n\n`;
              content += `${h}${t('ai_powered_insights')}\n${result.insights}\n`;
              break;
          case 'budget':
              content += `${b}${t('remaining_funds')}:${b} ${this.currencyService.format(result.remaining)}\n\n`;
              content += `${h}${t('ai_powered_insights')}\n${b}Analysis:${b} ${result.analysis}\n\n${b}Recommendations:${b}\n${result.recommendations.map((i: string) => li + i).join('\n')}\n`;
              break;
          case 'investment':
              content += `${b}${t('projected_future_value')}:${b} ${this.currencyService.format(result.futureValue)}\n`;
              content += `${b}${t('total_contributions')}:${b} ${this.currencyService.format(result.totalContributions)}\n`;
              content += `${b}${t('total_interest_earned')}:${b} ${this.currencyService.format(result.totalInterest)}\n\n`;
              content += `${h}${t('ai_powered_insights')}\n${result.insights}\n`;
              break;
          case 'annual_salary':
              content += `${b}${t('monthly_income')}:${b} ${this.currencyService.format(result.monthlyIncome)}\n`;
              content += `${b}${t('calculated_annual_salary')}:${b} ${this.currencyService.format(result.annualSalary)}\n`;
              break;
      }
      return content;
  }

  private getSmartToolResultAsHtml(result: any, tool: SmartTool): string {
    const t = this.translationService.translate();
    const title = t(tool.titleKey);
    let body = `<h1>${title}</h1>`;

     switch (tool.id) {
          case 'tax':
              body += `<h2>${t('estimated_tax_liability')}</h2><p>${result.taxLiability}</p>`;
              body += `<h2>${t('potential_deductions')}</h2><ul>${result.potentialDeductions.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
              body += `<h2>${t('tax_saving_tips')}</h2><ul>${result.taxSavingTips.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
              break;
          case 'profitability':
              body += `<div class="data-grid">
                <div class="data-item"><span class="data-label">${t('gross_profit')}:</span><br><span class="data-value">${this.currencyService.format(result.grossProfit)}</span></div>
                <div class="data-item"><span class="data-label">${t('operating_profit')}:</span><br><span class="data-value">${this.currencyService.format(result.operatingProfit)}</span></div>
                <div class="data-item"><span class="data-label">${t('net_profit_margin')}:</span><br><span class="data-value">${result.netProfitMargin.toFixed(2)}%</span></div>
              </div>`;
              body += `<h2>${t('ai_powered_insights')}</h2><p>${result.insights.replace(/\n/g, '<br>')}</p>`;
              break;
          case 'budget':
               body += `<div class="data-grid"><div class="data-item"><span class="data-label">${t('remaining_funds')}:</span><br><span class="data-value">${this.currencyService.format(result.remaining)}</span></div></div>`;
               body += `<h2>${t('ai_powered_insights')}</h2><p><b>Analysis:</b> ${result.analysis}</p><h3>Recommendations:</h3><ul>${result.recommendations.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
              break;
          case 'investment':
              body += `<div class="data-grid">
                <div class="data-item"><span class="data-label">${t('projected_future_value')}:</span><br><span class="data-value">${this.currencyService.format(result.futureValue)}</span></div>
                <div class="data-item"><span class="data-label">${t('total_contributions')}:</span><br><span class="data-value">${this.currencyService.format(result.totalContributions)}</span></div>
                <div class="data-item"><span class="data-label">${t('total_interest_earned')}:</span><br><span class="data-value">${this.currencyService.format(result.totalInterest)}</span></div>
              </div>`;
               body += `<h2>${t('ai_powered_insights')}</h2><p>${result.insights.replace(/\n/g, '<br>')}</p>`;
              break;
          case 'annual_salary':
              body += `<div class="data-grid">
                <div class="data-item"><span class="data-label">${t('monthly_income')}:</span><br><span class="data-value">${this.currencyService.format(result.monthlyIncome)}</span></div>
                <div class="data-item"><span class="data-label">${t('calculated_annual_salary')}:</span><br><span class="data-value">${this.currencyService.format(result.annualSalary)}</span></div>
              </div>`;
              break;
      }

    return `<html><head><title>${title}</title>${this.getPdfStyles()}</head><body>${body}</body></html>`;
  }
  // #endregion

  // #region Private Helpers
  private formatSections(sections: { title: string, content: string | string[] }[], format: 'txt' | 'md'): string {
    const heading = format === 'md' ? '##' : '';
    return sections.map(s => {
      const content = Array.isArray(s.content) ? s.content.join('\n') : s.content;
      return `${heading} ${s.title}\n\n${content}\n\n`;
    }).join('');
  }
  // #endregion
}