import { Injectable, inject, OnDestroy } from '@angular/core';
import { TaskService } from './task.service';
import { ToastService } from './toast.service';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskReminderService implements OnDestroy {
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);

  private checkInterval: any;

  constructor() {
    // Check every minute for upcoming tasks
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60 * 1000); 
    
    // Also check on application startup, after a short delay for tasks to load
    setTimeout(() => this.checkReminders(), 3000);
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkReminders() {
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const tasks = this.taskService.tasks();

    for (const task of tasks) {
      if (task.completed || task.reminderSent) {
        continue;
      }

      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();

      // If due within the next 24 hours and is not in the past
      if (timeDiff > 0 && timeDiff <= oneDayInMs) {
        this.sendReminder(task);
        this.taskService.updateTask({ ...task, reminderSent: true });
      }
    }
  }

  private sendReminder(task: Task) {
    this.toastService.show({
      type: 'info',
      titleKey: 'task_reminder_title',
      messageKey: 'task_reminder_body',
      params: { taskTitle: task.title },
      duration: 6000
    });
  }
}
