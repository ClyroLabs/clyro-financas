import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="mt-12 border-t border-white/5 bg-[#0A0F1A]/50 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <!-- Brand (Centered everywhere for maximum impact) -->
          <!-- Added overflow-hidden to contain aura -->
          <div class="col-span-1 md:col-span-1 flex flex-col items-center justify-center gap-0 relative group overflow-hidden py-4">
             <!-- High-Tech Aura (Behind Logo) - Significantly resized -->
             <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] pointer-events-none -z-10 flex items-center justify-center opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                <!-- Core Glow -->
                <div class="absolute w-[60%] h-[60%] bg-cyan-500/20 rounded-full blur-[30px] animate-pulse-slow"></div>
                <!-- Rings -->
                <div class="absolute w-[80%] h-[80%] rounded-full border border-cyan-500/30 border-t-cyan-400 border-r-transparent border-b-cyan-500/30 border-l-transparent animate-spin-slow shadow-[0_0_15px_rgba(6,182,212,0.2)]"></div>
                <div class="absolute w-[65%] h-[65%] rounded-full border border-blue-500/20 border-t-transparent border-r-blue-400 border-b-transparent border-l-blue-500/20 animate-reverse-spin"></div>
             </div>

             @if (settings().appLogoUrl) {
                <!-- 
                   Changes:
                   1. h-56 (Mobile/Tablet default) -> lg:h-40 (Desktop reduced for elegance)
                   2. -ml-6 (Nudge left for visual alignment)
                   3. -mt-4 (Pull closer to top margin)
                   4. EFFECT: animate-neon-pulse
                   5. PERFORMANCE: loading="lazy" (footer is below fold)
                -->
                <img [src]="settings().appLogoUrl" 
                     class="h-40 w-auto mb-0 -ml-0 animate-neon-pulse relative z-10" 
                     [alt]="settings().appName + ' logo'"
                     loading="lazy">
             }
          </div>

          <!-- Product Links -->
          <div class="text-center md:text-left pt-4 md:pt-0">
            <h3 class="text-sm font-semibold text-[#1E90FF] uppercase tracking-wider mb-4">{{ 'clyro_finances' | translate }}</h3>
            <ul class="space-y-2">
              <li><a routerLink="/pricing" class="text-gray-400 hover:text-white text-sm transition-colors">{{ 'pricing' | translate }}</a></li>
              <li><a routerLink="/financial-snapshot" class="text-gray-400 hover:text-white text-sm transition-colors">{{ 'financial_snapshot' | translate }}</a></li>
              <li><a routerLink="/business-plan" class="text-gray-400 hover:text-white text-sm transition-colors">{{ 'business_plan_ai' | translate }}</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div class="text-center md:text-left pt-4 md:pt-0">
            <h3 class="text-sm font-semibold text-[#1E90FF] uppercase tracking-wider mb-4">{{ 'smart_tools' | translate }}</h3>
            <ul class="space-y-2">
              <li><a routerLink="/tax-hub" class="text-gray-400 hover:text-white text-sm transition-colors">{{ 'tax_hub' | translate }}</a></li>
              <li><a routerLink="/market-insights" class="text-gray-400 hover:text-white text-sm transition-colors">{{ 'market_insights' | translate }}</a></li>
              <li><a routerLink="/consulting" class="text-gray-400 hover:text-white text-sm transition-colors">{{ 'consulting' | translate }}</a></li>
            </ul>
          </div>

          <!-- Social / Contact -->
          <div class="text-center md:text-left pt-4 md:pt-0">
            <h3 class="text-sm font-semibold text-[#1E90FF] uppercase tracking-wider mb-4">Social</h3>
            <div class="flex justify-center md:justify-start space-x-4">
              <!-- Icons hover updated to cyan-400 (Neon Blue) -->
              <a href="#" class="text-gray-400 hover:text-cyan-400 transition-colors">
                <span class="sr-only">Twitter</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-cyan-400 transition-colors">
                <span class="sr-only">GitHub</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <!-- Copyright text updated to White Bold -->
          <p class="text-sm text-white font-bold">
            &copy; {{ year }} {{ settings().appName }}. All rights reserved.
          </p>
          <div class="flex space-x-6 mt-4 md:mt-0 justify-center">
             <!-- Links text updated to Neon Blue -->
             <a href="#" class="text-sm text-cyan-400 hover:text-cyan-300 transition">Privacy Policy</a>
             <a href="#" class="text-sm text-cyan-400 hover:text-cyan-300 transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  adminService = inject(AdminService);
  settings = this.adminService.settings;
  year = new Date().getFullYear();
}