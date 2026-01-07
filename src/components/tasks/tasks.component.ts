import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task, Recurrence } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [TaskModalComponent, TranslatePipe, DatePipe],
  templateUrl: './tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent {
  taskService = inject(TaskService);
  translationService = inject(TranslationService);
  
  tasks = this.taskService.tasks;
  isModalOpen = signal(false);
  selectedTask = signal<Task | null>(null);

  today = new Date().toISOString().split('T')[0];

  sortedTasks = computed(() => {
    return this.tasks().slice().sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  });

  openAddTaskModal() {
    this.selectedTask.set(null);
    this.isModalOpen.set(true);
  }

  openEditTaskModal(task: Task) {
    this.selectedTask.set(task);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedTask.set(null);
  }

  saveTask(taskData: { title: string; description: string; dueDate: string; recurrence: Recurrence; }) {
    const taskToSave = this.selectedTask();
    if (taskToSave) {
      this.taskService.updateTask({ ...taskToSave, ...taskData });
    } else {
      this.taskService.addTask(taskData);
    }
    this.closeModal();
  }

  deleteTask(taskId: string) {
    const confirmationMessage = this.translationService.translate()('delete_task_confirm');
    if (confirm(confirmationMessage)) {
      this.taskService.deleteTask(taskId);
    }
  }

  toggleCompletion(taskId: string) {
    this.taskService.toggleTaskCompletion(taskId);
  }

  isDueSoon(task: Task): boolean {
    if (task.completed) {
      return false;
    }
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return timeDiff > 0 && timeDiff <= oneDayInMs;
  }

  getRecurrenceTooltip(recurrence: Recurrence): string {
    if (!recurrence || recurrence === 'none') {
        return '';
    }
    const t = this.translationService.translate();
    const recurrenceType = t(`recurrence_${recurrence}`);
    return `${t('task_recurring')}: ${recurrenceType}`;
  }
}
