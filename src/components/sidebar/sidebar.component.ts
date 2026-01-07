import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <!-- 
      GLASS SIDEBAR 
      - Uses .glass-panel from styles.css 
    -->
    <aside 
      class="h-full flex flex-col w-72 glass-panel transition-all duration-300">
      
      <!-- Logo Header Area -->
      <!-- Reduced aura size (w-[140px] vs old w-[200px]) and added overflow-hidden to prevent bleeding -->
      <div class="flex flex-col items-center justify-center px-6 h-auto pt-8 pb-6 border-b border-white/5 relative overflow-hidden group">
        <!-- Subtle internal glow for the logo area -->
        <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>

        <!-- High-Tech Aura (Behind Logo) - Resized to fit -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] pointer-events-none flex items-center justify-center transition-opacity duration-700 opacity-60 group-hover:opacity-100">
            <!-- Core Glow -->
            <div class="absolute w-[60%] h-[60%] bg-cyan-500/20 rounded-full blur-[40px] animate-pulse-slow"></div>
            <!-- Rings -->
            <div class="absolute w-[80%] h-[80%] rounded-full border border-cyan-500/30 border-t-cyan-400 border-r-transparent border-b-cyan-500/30 border-l-transparent animate-spin-slow shadow-[0_0_15px_rgba(6,182,212,0.2)]"></div>
            <div class="absolute w-[65%] h-[65%] rounded-full border border-blue-500/20 border-t-transparent border-r-blue-400 border-b-transparent border-l-blue-500/20 animate-reverse-spin"></div>
        </div>
        
        @if (settings().appLogoUrl) {
          <img [src]="settings().appLogoUrl" 
               class="relative z-10 h-32 w-auto object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] brightness-110 contrast-110 mb-0 -ml-4" 
               [alt]="settings().appName + ' logo'">
        } @else {
          <div class="h-24 w-24 rounded-full bg-gradient-to-br from-[#1E90FF] to-[#00BFFF] flex items-center justify-center shadow-[0_0_20px_rgba(30,144,255,0.6)] relative z-10">
             <svg class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
        }
        
        <!-- Neon Slogan -->
        <p class="relative z-20 text-center font-bold text-[9px] tracking-[0.3em] uppercase leading-none text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,1)] -mt-6">
          {{ 'slogan' | translate }}
        </p>
      </div>
      
      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar" data-tour-id="sidebar-nav">
          <!-- Dashboard -->
          <a routerLink="/dashboard" 
             routerLinkActive="bg-gradient-to-r from-cyan-500/20 to-transparent border-l-2 border-cyan-400 !text-white shadow-[inset_10px_0_20px_-10px_rgba(34,211,238,0.3)]" 
             [routerLinkActiveOptions]="{exact: true}" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent hover:border-cyan-500/50 transition-all duration-200 ease-out">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 text-gray-400 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              {{ 'dashboard' | translate }}
          </a>

          <!-- Financial Snapshot -->
          <a routerLink="/financial-snapshot" 
             routerLinkActive="bg-gradient-to-r from-blue-500/20 to-transparent border-l-2 border-blue-400 !text-white shadow-[inset_10px_0_20px_-10px_rgba(59,130,246,0.3)]" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-transparent hover:border-blue-500/50 transition-all duration-200 ease-out">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 text-gray-400 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              {{ 'financial_snapshot' | translate }}
          </a>
          
          <div class="pt-6 pb-2 px-4 text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] opacity-90">
            AI Tools
          </div>

          <!-- Business Plan -->
          <a routerLink="/business-plan" 
             routerLinkActive="bg-gradient-to-r from-purple-500/20 to-transparent border-l-2 border-purple-400 !text-white shadow-[inset_10px_0_20px_-10px_rgba(168,85,247,0.3)]" 
             data-tour-id="sidebar-ai-plan" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-transparent hover:border-purple-500/50 transition-all duration-200 ease-out">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 text-gray-400 group-hover:text-purple-400 group-hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {{ 'business_plan_ai' | translate }}
              </div>
              @if (user()?.subscriptionPlan !== 'premium') {
                <span class="ml-2 text-[9px] font-bold bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.3)]">PRO</span>
              }
          </a>

           <!-- Market Insights -->
           <a routerLink="/market-insights" 
              routerLinkActive="bg-gradient-to-r from-purple-500/20 to-transparent border-l-2 border-purple-400 !text-white shadow-[inset_10px_0_20px_-10px_rgba(168,85,247,0.3)]" 
              (click)="closeSidebarOnMobile()"
              class="group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-transparent hover:border-purple-500/50 transition-all duration-200 ease-out">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 text-gray-400 group-hover:text-purple-400 group-hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                {{ 'market_insights' | translate }}
              </div>
              @if (user()?.subscriptionPlan !== 'premium') {
                <span class="ml-2 text-[9px] font-bold bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.3)]">PRO</span>
              }
          </a>

          <!-- Tax Hub -->
          <a routerLink="/tax-hub" 
             routerLinkActive="bg-gradient-to-r from-amber-500/20 to-transparent border-l-2 border-amber-400 !text-white shadow-[inset_10px_0_20px_-10px_rgba(245,158,11,0.3)]" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-transparent hover:border-amber-500/50 transition-all duration-200 ease-out">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 text-gray-400 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                {{ 'tax_hub' | translate }}
              </div>
          </a>
          
          <div class="pt-6 pb-2 px-4 text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] opacity-90">
            Services
          </div>

          <!-- Consulting -->
          <a routerLink="/consulting" 
             routerLinkActive="bg-gradient-to-r from-emerald-500/20 to-transparent border-l-2 border-emerald-400 !text-white shadow-[inset_10px_0_20px_-10px_rgba(16,185,129,0.3)]" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-transparent hover:border-emerald-500/50 transition-all duration-200 ease-out">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 text-gray-400 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {{ 'consulting' | translate }}
          </a>
      </nav>
      
      <!-- Bottom Links -->
      <div class="mt-auto p-4 border-t border-white/5 space-y-1 bg-black/20">
          <!-- Pricing -->
          <a routerLink="/pricing" 
             routerLinkActive="bg-white/10 !text-white" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-colors text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v.01M12 18v-2m0-2v-2m0 4V10m0 0v2m0-2V8m0 2h.01M12 10h.01M12 12h.01M12 14h.01M12 8h.01M12 6h.01M12 4h.01M12 2h.01M12 22h.01M12 20h.01M12 18h.01M12 16h.01M12 14h.01M12 12h.01M10 2h.01M8 2h.01M6 2h.01M4 2h.01M2 4h.01M2 6h.01M2 8h.01M2 10h.01M2 12h.01M2 14h.01M2 16h.01M2 18h.01M2 20h.01M2 22h.01M4 22h.01M6 22h.01M8 22h.01M10 22h.01M14 22h.01M16 22h.01M18 22h.01M20 22h.01M22 20h.01M22 18h.01M22 16h.01M22 14h.01M22 12h.01M22 10h.01M22 8h.01M22 6h.01M22 4h.01M20 2h.01M18 2h.01M16 2h.01M14 2h.01" /></svg>
              {{ 'pricing' | translate }}
          </a>

          <!-- Settings -->
          <a routerLink="/settings" 
             routerLinkActive="bg-white/10 !text-white" 
             data-tour-id="settings-page-link" 
             (click)="closeSidebarOnMobile()"
             class="group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-colors text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {{ 'settings' | translate }}
          </a>

          <!-- Admin -->
          @if (user()?.role === 'super-admin') {
            <a routerLink="/admin" 
               routerLinkActive="bg-red-500/10 !text-red-400 border border-red-500/30" 
               (click)="closeSidebarOnMobile()"
               class="group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 flex-shrink-0 h-5 w-5 transition-colors text-gray-400 group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                {{ 'admin' | translate }}
            </a>
          }
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  authService = inject(AuthService);
  adminService = inject(AdminService);
  uiStateService = inject(UiStateService);
  
  user = this.authService.user;
  settings = this.adminService.settings;

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) { // md breakpoint
      this.uiStateService.sidebarOpen.set(false);
    }
  }
}