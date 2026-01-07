import { ChangeDetectionStrategy, Component, inject, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { UiStateService } from './services/ui-state.service';
import { AuthService } from './services/auth.service';
import { OnboardingService } from './services/onboarding.service';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { ToastComponent } from './components/toast/toast.component';
import { TaskReminderService } from './services/task-reminder.service';
import { AdminService } from './services/admin.service';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, OnboardingComponent, ToastComponent, FooterComponent],
  host: {
    '(window:resize)': 'onResize($event)'
  }
})
export class AppComponent implements OnInit {
  uiStateService = inject(UiStateService);
  authService = inject(AuthService);
  onboardingService = inject(OnboardingService);
  private taskReminderService = inject(TaskReminderService);
  private adminService = inject(AdminService);
  
  sidebarOpen = this.uiStateService.sidebarOpen;
  isAuthenticated = this.authService.isAuthenticated;

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        this.onboardingService.startTourIfNeeded();
      }
    });

    effect(() => {
      // Dynamically set the document title from admin settings
      document.title = this.adminService.settings().appName;
    });
  }

  onResize(event: Event) {
    if (this.isAuthenticated()) {
      if ((event.target as Window).innerWidth >= 768) {
        this.sidebarOpen.set(true);
      } else {
        this.sidebarOpen.set(false);
      }
    }
  }

  ngOnInit() {
    if (this.isAuthenticated()) {
      this.sidebarOpen.set(window.innerWidth >= 768);
    }
  }
}