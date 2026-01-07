import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (toast(); as currentToast) {
      <div class="fixed bottom-8 left-8 z-[100] animate-fade-in-out w-full max-w-sm">
        <div
          class="flex items-start text-white p-4 rounded-lg shadow-2xl bg-gray-800 border-l-4"
          [class]="{
            'border-green-500': currentToast.type === 'success',
            'border-red-500': currentToast.type === 'error',
            'border-blue-500': currentToast.type === 'info'
          }">
            <div class="flex-shrink-0 pt-0.5"
              [class]="{
                'text-green-500': currentToast.type === 'success',
                'text-red-500': currentToast.type === 'error',
                'text-blue-500': currentToast.type === 'info'
              }">
              @if (currentToast.type === 'success') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } @else if (currentToast.type === 'error') {
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } @else {
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            </div>
            <div class="ml-3 w-0 flex-1">
              @if(currentToast.titleKey) {
                <p class="text-sm font-semibold text-gray-100">{{ currentToast.titleKey | translate:currentToast.params }}</p>
              }
              <p class="text-sm text-gray-300" [class.mt-1]="currentToast.titleKey">{{ currentToast.messageKey | translate:currentToast.params }}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
               <button (click)="toastService.hide()" class="inline-flex rounded-md text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
            </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in-out {
      0% { opacity: 0; transform: translateY(20px); }
      10% { opacity: 1; transform: translateY(0); }
      90% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(20px); }
    }

    .animate-fade-in-out {
      animation: fade-in-out 4s ease-in-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  toastService = inject(ToastService);
  toast = this.toastService.toast;
}
