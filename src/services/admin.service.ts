import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'dark' | 'light' | 'transparent';

export interface AdminSettings {
  appName: string;
  appLogoUrl: string;
  stripeApiKey: string;
  gatePayClientId: string;
  gatePayApiKey: string;
  gatePayApiSecret: string;
  siteUrl: string;
  checkoutLogoUrl: string;
  enableCreditCard: boolean;
  enableCrypto: boolean;
  enablePix: boolean;
  enableBankTransfer: boolean;
  pixKey: string;
  bankAccountBR: {
    bankName: string;
    agency: string;
    account: string;
    cnpj: string;
    beneficiary: string;
  };
  bankAccountIntl: {
    bankName: string;
    swift: string;
    iban: string;
    address: string;
    beneficiary: string;
  };
  theme: ThemeMode;
}

export interface FinancialReport {
  totalActiveSubscriptions: number;
  monthlyRevenue: number;
  freeUsers: number;
  basicUsers: number;
  premiumUsers: number;
  blockedUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private _settings = signal<AdminSettings>({
    appName: 'Clyro',
    appLogoUrl: 'https://i.ibb.co/VYhSJzyf/Gemini-Generated-Image-d08xr8d08xr8d08x-Photoroom.png',
    stripeApiKey: 'sk_test_...your_mock_key',
    gatePayClientId: '40613072',
    gatePayApiKey: 'fa2a8f89065e75fa93a704efececcacd',
    gatePayApiSecret: 'fea74068989403a3e6575d96a534461d0183bfc172a90d22d9c0779716a19ac6',
    siteUrl: 'https://app.clyro.com',
    checkoutLogoUrl: '/assets/logo.svg',
    enableCreditCard: true,
    enableCrypto: true,
    enablePix: true,
    enableBankTransfer: true,
    pixKey: '12345678000199',
    bankAccountBR: {
      bankName: 'Banco do Brasil',
      agency: '1234-5',
      account: '12345-6',
      cnpj: '12.345.678/0001-99',
      beneficiary: 'Clyro Labs LTDA'
    },
    bankAccountIntl: {
      bankName: 'Bank of America',
      swift: 'BOFAUS3N',
      iban: 'US12 3456 7890 1234 5678 90',
      address: '100 North Tryon Street, Charlotte, NC 28255, USA',
      beneficiary: 'Clyro Labs Inc.'
    },
    theme: 'dark'
  });

  public readonly settings = this._settings.asReadonly();
  public readonly theme = computed(() => this._settings().theme);

  updateSettings(newSettings: Partial<AdminSettings>) {
    this._settings.update(current => ({ ...current, ...newSettings }));
    console.log('Admin settings updated:', this.settings());

    // Apply theme to document
    if (newSettings.theme) {
      this.applyTheme(newSettings.theme);
    }
  }

  setTheme(theme: ThemeMode) {
    this.updateSettings({ theme });
  }

  private applyTheme(theme: ThemeMode) {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light', 'theme-transparent');
    body.classList.add(`theme-${theme}`);
  }
}