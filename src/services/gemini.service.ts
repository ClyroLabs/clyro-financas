import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// For Detailed Tax Analysis
export interface DetailedTaxScenario {
  country: 'usa' | 'brazil';
  salary: number;
  freelanceIncome: number;
  investmentGains: number;
  deductions: number;
  maritalStatus: 'single' | 'married_jointly';
}

// For Business Profitability
export interface BusinessProfitabilityData {
  revenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  operatingProfit: number;
  netProfitMargin: number;
}

// For Personal Budget
export interface PersonalBudgetData {
  income: number;
  housing: number;
  transportation: number;
  food: number;
  entertainment: number;
  savings: number;
  other: number;
  remaining: number;
}

// For Investment Returns
export interface InvestmentData {
  initial: number;
  monthly: number;
  rate: number;
  years: number;
  futureValue: number;
}


@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  isInitialized = signal(false);
  
  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      try {
        this.genAI = new GoogleGenAI({apiKey});
        this.isInitialized.set(true);
      } catch (e) {
        console.error('Failed to initialize GoogleGenAI. This can happen with an invalid key or network issues.', e);
        this.isInitialized.set(false);
      }
    } else {
      console.error('Gemini API key not found. The API_KEY environment variable is missing.');
      this.isInitialized.set(false);
    }
  }

  // FIX: Add missing getFinancialAdvice method.
  async getFinancialAdvice(data: any): Promise<string | null> {
    if (!this.genAI) return null;
    
    // De-structure for clarity in the prompt
    const { 
        fixedRevenue, sporadicRevenue, fixedExpenses, unforeseenExpenses, 
        personalSpending, productCost, salePrice 
    } = data;
    const { 
        netBalance, productMargin, totalRevenue, totalExpenses, inflationAdjustment 
    } = data.analysis;

    const prompt = `
      Analyze the following personal/small business financial data for a user and provide actionable, concise advice.
      The user has provided their monthly financial inputs, and we have calculated some key metrics.
      Based on this, generate a short, encouraging, and helpful paragraph of financial advice.
      Focus on the most impactful area (e.g., high expenses, low revenue, good savings, etc.).
      Do not format the output as JSON. Just return a single string of text.

      User's Monthly Data:
      - Total Revenue: ${totalRevenue}
      - Total Expenses: ${totalExpenses}
      - Net Balance: ${netBalance}
      - Product/Service Profit Margin: ${productMargin ? (productMargin * 100).toFixed(2) + '%' : 'N/A'}
      
      Your advice should be a single paragraph.
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      return response.text.trim();
    } catch (error) {
      console.error('Error generating financial advice:', error);
      return "We couldn't generate advice at this time. Please try again later.";
    }
  }

  async generateBusinessPlan(
    niche: string,
    businessName: string,
    businessDescription: string,
    targetAudience: string,
    marketingStrategy: string,
    financialProjections: string,
    language: string
  ): Promise<any | null> {
    if (!this.genAI) return null;

    const prompt = `
      Generate a comprehensive, step-by-step business plan for a new startup from scratch in the "${niche}" niche.
      The user has provided some basic details below. Use them to create a detailed, actionable plan.
      The output must be a JSON object.
      The language for the entire response, including all text values, must be: ${language}.

      User-provided Details:
      - Business Name: ${businessName}
      - Business Description: ${businessDescription}
      - Target Audience: ${targetAudience}
      - Marketing Strategy: ${marketingStrategy}
      - Financial Projections: ${financialProjections}

      Structure the JSON object with the following keys and content:
      1.  "executiveSummary": A compelling summary of the business.
      2.  "companyDescription": A detailed description of the company.
      3.  "marketAnalysis": An analysis of the target market and competition for the "${niche}" niche.
      4.  "organizationAndManagement": The proposed organizational structure.
      5.  "productsOrServices": A description of the products or services offered.
      6.  "marketingAndSales": A detailed marketing and sales strategy.
      7.  "financialPlan": An object containing:
          - "startupCosts": A string with a detailed list of estimated one-time startup costs.
          - "monthlyOperatingCosts": A string with a detailed list of projected monthly recurring costs.
          - "revenueProjections": A string containing a projected 12-month Profit & Loss statement, preferably in a markdown table format.
          - "breakEvenAnalysis": A string explaining the break-even point and when it's expected to be reached.
      8.  "implementationRoadmap": A string with a step-by-step roadmap divided into phases (e.g., Phase 1: Months 1-3) for launching the business from zero.
      9.  "keyPerformanceIndicators": A string explaining the most important KPIs to track for success in this business.
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              companyDescription: { type: Type.STRING },
              marketAnalysis: { type: Type.STRING },
              organizationAndManagement: { type: Type.STRING },
              productsOrServices: { type: Type.STRING },
              marketingAndSales: { type: Type.STRING },
              financialPlan: {
                type: Type.OBJECT,
                properties: {
                    startupCosts: { type: Type.STRING, description: "Detailed list of one-time startup costs." },
                    monthlyOperatingCosts: { type: Type.STRING, description: "Detailed list of projected monthly operational costs." },
                    revenueProjections: { type: Type.STRING, description: "A 12-month profit and loss projection, preferably in a markdown table format." },
                    breakEvenAnalysis: { type: Type.STRING, description: "An analysis of when the business is expected to break even." }
                },
                required: ["startupCosts", "monthlyOperatingCosts", "revenueProjections", "breakEvenAnalysis"]
              },
              implementationRoadmap: { type: Type.STRING, description: "A step-by-step roadmap for implementing the business, divided into phases (e.g., Months 1-3)." },
              keyPerformanceIndicators: { type: Type.STRING, description: "A list and explanation of key performance indicators (KPIs) to track for this business." }
            },
            required: ["executiveSummary", "companyDescription", "marketAnalysis", "organizationAndManagement", "productsOrServices", "marketingAndSales", "financialPlan", "implementationRoadmap", "keyPerformanceIndicators"]
          }
        },
      });
      
      const jsonText = response.text.trim();
      return JSON.parse(jsonText);

    } catch (error) {
      console.error('Error generating business plan:', error);
      return null;
    }
  }

  async getMarketInsights(niche: string, language: string): Promise<any | null> {
    if (!this.genAI) return null;

    const prompt = `
      Provide a detailed market analysis for the business niche: "${niche}".
      The response must be a JSON object.
      The language of the entire response, including all text values, must be: ${language}.
      The JSON object must have the following keys: "marketTrends", "keyStatistics", "targetAudienceAnalysis", "opportunities", and "challenges".
      - "marketTrends": A string containing a detailed paragraph about current market trends.
      - "keyStatistics": A string containing key statistics like market size and growth rate, formatted nicely.
      - "targetAudienceAnalysis": A string containing a paragraph analyzing the typical target audience.
      - "opportunities": A string containing a paragraph about potential opportunities in this niche.
      - "challenges": A string containing a paragraph about potential challenges and risks.
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketTrends: { type: Type.STRING },
              keyStatistics: { type: Type.STRING },
              targetAudienceAnalysis: { type: Type.STRING },
              opportunities: { type: Type.STRING },
              challenges: { type: Type.STRING },
            },
            required: ["marketTrends", "keyStatistics", "targetAudienceAnalysis", "opportunities", "challenges"]
          }
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error generating market insights:', error);
      return null;
    }
  }

  async getDetailedTaxAnalysis(scenario: DetailedTaxScenario, language: string): Promise<any | null> {
    if (!this.genAI) return null;

    const prompt = `
      Analyze the following financial scenario for a user in ${scenario.country.toUpperCase()} and provide a tax analysis.
      The output must be a JSON object with three keys: "taxLiability", "potentialDeductions", and "taxSavingTips".
      The response text must be in ${language}.
      - "taxLiability" should be a string summarizing the estimated tax liability in the local currency.
      - "potentialDeductions" should be an array of strings, where each string is a potential tax deduction relevant to the user's situation.
      - "taxSavingTips" should be an array of strings, where each string is an actionable tax-saving tip.
      
      User's Situation:
      - Marital Status: ${scenario.maritalStatus}
      - Annual Salary: ${scenario.salary}
      - Freelance/Side Income: ${scenario.freelanceIncome}
      - Investment Gains: ${scenario.investmentGains}
      - Pre-tax deductions (e.g., retirement): ${scenario.deductions}
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              taxLiability: { type: Type.STRING },
              potentialDeductions: { type: Type.ARRAY, items: { type: Type.STRING } },
              taxSavingTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["taxLiability", "potentialDeductions", "taxSavingTips"]
          }
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error getting detailed tax analysis:', error);
      return null;
    }
  }

  async getBusinessProfitabilityInsights(data: BusinessProfitabilityData, language: string): Promise<any | null> {
    if (!this.genAI) return null;

    const prompt = `
      Analyze the following monthly business financial data. The calculations have already been performed.
      Provide actionable insights and suggestions for improvement in a JSON object with one key: "insights".
      The response text must be in ${language}.
      - "insights" should be a string of well-structured paragraphs. Focus on how to potentially increase revenue, reduce COGS, or manage operating expenses better based on the provided numbers.

      Financial Data:
      - Total Monthly Revenue: ${data.revenue}
      - Cost of Goods Sold (COGS): ${data.cogs}
      - Monthly Operating Expenses: ${data.expenses}

      Calculated Metrics:
      - Gross Profit: ${data.grossProfit}
      - Operating Profit: ${data.operatingProfit}
      - Net Profit Margin: ${data.netProfitMargin.toFixed(2)}%
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: { type: Type.STRING }
            },
            required: ["insights"]
          }
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error getting business profitability insights:', error);
      return null;
    }
  }

  async getPersonalBudgetAdvice(data: PersonalBudgetData, language: string): Promise<any | null> {
    if (!this.genAI) return null;

    const prompt = `
      Analyze the following personal monthly budget.
      Provide a concise analysis and a list of actionable recommendations in a JSON object with two keys: "analysis" and "recommendations".
      The response text must be in ${language}.
      - "analysis" should be a string summarizing the budget's health (e.g., surplus/deficit, high spending areas).
      - "recommendations" should be an array of strings, with each string being a specific, actionable tip for improvement.

      Budget Data:
      - Total Monthly Income: ${data.income}
      - Housing: ${data.housing}
      - Transportation: ${data.transportation}
      - Food & Groceries: ${data.food}
      - Entertainment & Leisure: ${data.entertainment}
      - Savings & Investments: ${data.savings}
      - Other Expenses: ${data.other}
      - Remaining Funds / Deficit: ${data.remaining}
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["analysis", "recommendations"]
          }
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error getting personal budget advice:', error);
      return null;
    }
  }
  
  async getInvestmentInsights(data: InvestmentData, language: string): Promise<any | null> {
    if (!this.genAI) return null;

    const prompt = `
      A user has calculated their potential investment returns.
      Based on the following data and result, provide some simple, encouraging insights about the power of compound interest, long-term investing, and consistent contributions.
      The output must be a JSON object with one key: "insights".
      The response text must be in ${language}.
      - "insights" should be a string of 2-3 short, encouraging paragraphs. Do not give specific financial advice.

      Investment Data:
      - Initial Investment: ${data.initial}
      - Monthly Contribution: ${data.monthly}
      - Investment Period: ${data.years} years
      - Estimated Annual Rate: ${data.rate}%
      - Calculated Future Value: ${data.futureValue.toFixed(2)}
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: { type: Type.STRING }
            },
            required: ["insights"]
          }
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error getting investment insights:', error);
      return null;
    }
  }
}