import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { subscriptionGuard } from './guards/subscription.guard';
import { basicGuard } from './guards/basic.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup', loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'financial-snapshot',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/financial-snapshot/financial-snapshot.component').then(m => m.FinancialSnapshotPageComponent)
  },
  {
    path: 'business-plan',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () => import('./pages/business-plan/business-plan.component').then(m => m.BusinessPlanComponent)
  },
  {
    path: 'market-insights',
    canActivate: [authGuard, subscriptionGuard],
    loadComponent: () => import('./pages/market-insights/market-insights.component').then(m => m.MarketInsightsComponent)
  },
  {
    path: 'tax-hub',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tax-hub/tax-hub.component').then(m => m.TaxHubComponent)
  },
  {
    path: 'consulting',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/consulting/consulting.component').then(m => m.ConsultingComponent)
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent)
  },
  {
    path: 'checkout/:plan',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];