import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { OnboardingService, TourStep } from '../../services/onboarding.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface TooltipPosition {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  transform?: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  onboardingService = inject(OnboardingService);
  private renderer = inject(Renderer2);

  isTourActive = this.onboardingService.isTourActive;
  currentStep = this.onboardingService.currentStep;
  
  highlightedElementStyle = signal<Partial<CSSStyleDeclaration>>({});
  tooltipPosition = signal<TooltipPosition>({});
  
  private previousHighlightedElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const step = this.currentStep();
      
      // Cleanup previous element
      if (this.previousHighlightedElement) {
        this.renderer.removeClass(this.previousHighlightedElement, 'onboarding-highlight');
      }

      if (step && this.isTourActive()) {
        // Using setTimeout to wait for element to be available after navigation/rerender
        setTimeout(() => {
          const element = document.querySelector(step.elementSelector) as HTMLElement;
          if (element) {
            this.updateHighlight(element);
            this.updateTooltipPosition(element, step);
            this.previousHighlightedElement = element;
          } else {
            console.warn(`Onboarding element not found: ${step.elementSelector}`);
            // Maybe skip this step or end tour if element is crucial
            this.onboardingService.skipTour();
          }
        }, 100); // 100ms delay to be safe
      }
    });
  }

  private updateHighlight(element: HTMLElement) {
    this.renderer.addClass(element, 'onboarding-highlight');
  }

  private updateTooltipPosition(element: HTMLElement, step: TourStep) {
    const rect = element.getBoundingClientRect();
    const tooltipPos: TooltipPosition = {};
    const margin = 12; // 12px margin from the element

    switch (step.position) {
      case 'bottom':
        tooltipPos.top = `${rect.bottom + margin}px`;
        tooltipPos.left = `${rect.left + rect.width / 2}px`;
        tooltipPos.transform = 'translateX(-50%)';
        break;
      case 'top':
        tooltipPos.top = `${rect.top - margin}px`;
        tooltipPos.left = `${rect.left + rect.width / 2}px`;
        tooltipPos.transform = 'translate(-50%, -100%)';
        break;
      case 'left':
        tooltipPos.top = `${rect.top + rect.height / 2}px`;
        tooltipPos.left = `${rect.left - margin}px`;
        tooltipPos.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
      default:
        tooltipPos.top = `${rect.top + rect.height / 2}px`;
        tooltipPos.left = `${rect.right + margin}px`;
        tooltipPos.transform = 'translateY(-50%)';
        break;
    }
    this.tooltipPosition.set(tooltipPos);
  }

  next() {
    this.onboardingService.nextStep();
  }

  skip() {
    this.onboardingService.skipTour();
  }
}
