import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  sidebarOpen = signal(false);

  constructor() {}

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }
}
