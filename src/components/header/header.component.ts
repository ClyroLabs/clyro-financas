import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UiStateService } from '../../services/ui-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, TranslatePipe, RouterLink],
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class HeaderComponent {
  authService = inject(AuthService);
  user = this.authService.user;
  uiStateService = inject(UiStateService);

  isDropdownOpen = signal(false);

  toggleSidebar() {
    this.uiStateService.toggleSidebar();
  }
  
  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-button') && this.isDropdownOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  logout() {
    this.isDropdownOpen.set(false);
    this.authService.logout();
  }
}