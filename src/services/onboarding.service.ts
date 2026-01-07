import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface TourStep {
  step: number;
  elementSelector: string;
  titleKey: string;
  contentKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    elementSelector: '[data-tour-id="dashboard-cards"]',
    titleKey: 'tour_dashboard_cards_title',
    contentKey: 'tour_dashboard_cards_content',
    position: 'bottom'
  },
  {
    step: 2,
    elementSelector: '[data-tour-id="sidebar-nav"]',
    titleKey: 'tour_sidebar_nav_title',
    contentKey: 'tour_sidebar_nav_content',
    position: 'right'
  },
  {
    step: 3,
    elementSelector: '[data-tour-id="sidebar-ai-plan"]',
    titleKey: 'tour_sidebar_ai_plan_title',
    contentKey: 'tour_sidebar_ai_plan_content',
    position: 'right'
  },
  {
    step: 4,
    elementSelector: '[data-tour-id="header-user-menu"]',
    titleKey: 'tour_header_user_menu_title',
    contentKey: 'tour_header_user_menu_content',
    position: 'bottom'
  },
   {
    step: 5,
    elementSelector: '[data-tour-id="settings-page-link"]',
    titleKey: 'tour_settings_link_title',
    contentKey: 'tour_settings_link_content',
    position: 'right'
  },
];

const ONBOARDING_KEY = 'clyro-onboarding-completed';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private router = inject(Router);

  isTourActive = signal(false);
  currentStepIndex = signal(0);
  
  private tourSteps = signal<TourStep[]>(TOUR_STEPS);
  
  currentStep = computed<TourStep | null>(() => {
    if (!this.isTourActive()) {
      return null;
    }
    return this.tourSteps()[this.currentStepIndex()] ?? null;
  });

  constructor() {
    // If user navigates away, stop the tour
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if(this.isTourActive()) {
        const currentStep = this.currentStep();
        if(currentStep?.elementSelector === '[data-tour-id="settings-page-link"]' && this.router.url.includes('/settings')) {
          // It's fine, we are navigating to the settings page as part of the tour
        } else if (!this.router.url.includes('/dashboard')) {
           this.skipTour();
        }
      }
    });
  }

  /**
   * Checks if the user has completed the onboarding tour and starts it if they haven't.
   * This logic correctly handles the scenarios for a first-time user experience:
   * 1. First Login: The 'clyro-onboarding-completed' key will not exist in localStorage.
   * 2. New Device/Browser: Each browser on each device has its own localStorage, so the key will be absent.
   * 3. Cache Clear: Clearing site data/cache removes localStorage, so the key will be absent.
   * The tour is only skipped if `localStorage.getItem('clyro-onboarding-completed')` is explicitly 'true',
   * effectively disabling it for all subsequent logins on the same browser until the cache is cleared.
   */
  startTourIfNeeded() {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
    if (hasCompleted !== 'true') {
      // Small delay to ensure view is rendered
      setTimeout(() => {
        this.currentStepIndex.set(0);
        this.isTourActive.set(true);
      }, 500);
    }
  }

  nextStep() {
    if (this.currentStepIndex() < this.tourSteps().length - 1) {
      this.currentStepIndex.update(i => i + 1);
      const nextStep = this.tourSteps()[this.currentStepIndex()];
      if(nextStep.elementSelector === '[data-tour-id="settings-page-link"]') {
        this.router.navigate(['/settings']);
      }
    } else {
      this.completeTour();
    }
  }

  completeTour() {
    this.isTourActive.set(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
     if(this.router.url.includes('/settings')) {
        this.router.navigate(['/dashboard']);
     }
  }

  skipTour() {
    this.completeTour();
  }
}
