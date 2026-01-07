import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService, GoogleAuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-google-auth-modal',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (show()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="onClose()">
        <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700/50" (click)="$event.stopPropagation()">
          <div class="p-6 border-b border-gray-700/50">
             <div class="flex items-center justify-center space-x-2 mb-4">
                <svg class="w-6 h-6" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M43.611,20.083H24v8.53h11.004c-0.467,2.779-2.049,5.15-4.9,6.726v5.528h7.117C45.396,36.562,48,29.336,48,20.083 C48,16.533,47.411,13.238,46.345,10.23Z"></path><path fill="#34A853" d="M24,48c6.48,0,11.93-2.131,15.897-5.771l-7.117-5.528c-2.163,1.464-4.956,2.331-8.78,2.331 c-6.7,0-12.37-4.512-14.386-10.59H2.034v5.701C5.939,41.923,14.28,48,24,48z"></path><path fill="#FBBC05" d="M9.614,28.746c-0.54-1.625-0.84-3.344-0.84-5.119s0.3-3.494,0.84-5.119V12.81H2.034C0.778,15.548,0,19.986,0,24 c0,4.014,0.778,8.452,2.034,11.19l7.58-5.701Z"></path><path fill="#EA4335" d="M24,9.555c3.558,0,6.291,1.521,8.086,3.248l6.237-6.237C35.923,2.545,30.478,0,24,0 C14.28,0,5.939,6.077,2.034,14.51l7.58,5.701C11.63,14.067,17.3,9.555,24,9.555z"></path></svg>
                <span class="text-xl font-bold text-gray-100">{{ 'clyro_finances' | translate }}</span>
            </div>
            <h3 class="text-xl font-bold text-white text-center">{{ 'choose_an_account' | translate }}</h3>
            <p class="text-sm text-gray-400 text-center mt-1">{{ 'continue_as' | translate }} Clyro</p>
          </div>
          <div class="p-4 max-h-80 overflow-y-auto">
            <ul class="space-y-2">
              @for(user of users; track user.email) {
                <li>
                  <button (click)="accountSelected.emit(user.email)" class="w-full flex items-center p-3 rounded-lg hover:bg-gray-700/50 transition text-left">
                    <img [src]="user.avatarUrl || 'https://i.pravatar.cc/150?u=' + user.email" class="w-10 h-10 rounded-full object-cover mr-4" alt="User avatar">
                    <div class="flex-1">
                      <p class="font-semibold text-white">{{ user.name }}</p>
                      <p class="text-sm text-gray-400">{{ user.email }}</p>
                    </div>
                  </button>
                </li>
              }
            </ul>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleAuthModalComponent {
  show = input.required<boolean>();
  
  accountSelected = output<string>();
  close = output<void>();

  private authService = inject(AuthService);
  users: GoogleAuthUser[] = [];

  constructor() {
    this.users = this.authService.getGoogleAuthUsers();
  }

  onClose() {
    this.close.emit();
  }
}