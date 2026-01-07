import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  permission = signal<NotificationPermission>('default');

  constructor() {
    if (this.isSupported()) {
      this.permission.set(Notification.permission);
    }
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  async requestPermission(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser.');
      return;
    }

    const result = await Notification.requestPermission();
    this.permission.set(result);
    if (result === 'granted') {
      console.log('Notification permission granted.');
      // In a real app, you would get the push subscription here and send it to your server.
      // e.g., navigator.serviceWorker.ready.then(reg => reg.pushManager.subscribe(...));
    } else {
      console.log('Notification permission denied.');
    }
  }

  showLocalNotification(title: string, options?: NotificationOptions): void {
    if (!this.isSupported() || this.permission() !== 'granted') {
      console.warn('Cannot show notification. Permission not granted or not supported.');
      return;
    }
    
    // In a real app with a service worker, this logic would live in the service worker
    // to handle push events from the server. For this simulation, we create the
    // notification directly.
    new Notification(title, options);
  }
}
