import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  messageKey: string;
  titleKey?: string;
  params?: Record<string, string | number>;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toast = signal<Toast | null>(null);
  private timer: any;

  show(options: {
    messageKey: string;
    titleKey?: string;
    type?: ToastType;
    duration?: number;
    params?: Record<string, string | number>;
  }) {
    const {
      messageKey,
      titleKey,
      type = 'success',
      duration = 4000, // Increased duration for better readability
      params
    } = options;
    
    this.toast.set({ messageKey, titleKey, type, params });
    
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.toast.set(null);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
