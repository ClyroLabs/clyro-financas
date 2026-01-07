import { Injectable, signal } from '@angular/core';
import { Task, Recurrence } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly TASKS_KEY = 'clyro-tasks';
  tasks = signal<Task[]>([]);

  constructor() {
    this.loadTasks();
  }

  private loadTasks() {
    const tasksJson = localStorage.getItem(this.TASKS_KEY);
    const savedTasks = tasksJson ? JSON.parse(tasksJson) : [];
    this.tasks.set(savedTasks);
  }

  private saveTasks() {
    localStorage.setItem(this.TASKS_KEY, JSON.stringify(this.tasks()));
  }

  addTask(taskData: { title: string; description: string; dueDate: string; recurrence: Recurrence; }) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      completed: false,
      reminderSent: false,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      recurrence: taskData.recurrence
    };
    this.tasks.update(tasks => [...tasks, newTask]);
    this.saveTasks();
  }

  updateTask(updatedTask: Task) {
    this.tasks.update(tasks =>
      tasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
    this.saveTasks();
  }

  deleteTask(taskId: string) {
    this.tasks.update(tasks => tasks.filter(task => task.id !== taskId));
    this.saveTasks();
  }

  toggleTaskCompletion(taskId: string) {
    const taskToToggle = this.tasks().find(t => t.id === taskId);
    if (!taskToToggle) return;

    // If we are marking a task as COMPLETE (not incomplete) and it's a recurring task...
    if (!taskToToggle.completed && taskToToggle.recurrence && taskToToggle.recurrence !== 'none') {
        this.createNextRecurrence(taskToToggle);
    }

    // Now, toggle the completion status of the original task
    this.tasks.update(tasks =>
      tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    this.saveTasks();
  }

  private createNextRecurrence(completedTask: Task) {
    // Use UTC to avoid timezone issues when calculating the next date
    const nextDueDate = new Date(completedTask.dueDate + 'T00:00:00Z');

    switch (completedTask.recurrence) {
      case 'daily':
        nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 1);
        break;
      case 'weekdays':
        let day = nextDueDate.getUTCDay(); // Sunday - 0, ..., Friday - 5, Saturday - 6
        let daysToAdd = 1;
        if (day === 5) { // Friday
          daysToAdd = 3;
        } else if (day === 6) { // Saturday
          daysToAdd = 2;
        }
        nextDueDate.setUTCDate(nextDueDate.getUTCDate() + daysToAdd);
        break;
      case 'weekly':
        nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 7);
        break;
      case 'biweekly':
        nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 14);
        break;
      case 'monthly':
        nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
        break;
      default:
        return; // Should not happen for 'none' or other cases
    }

    const nextDueDateString = nextDueDate.toISOString().split('T')[0];

    this.addTask({
      title: completedTask.title,
      description: completedTask.description,
      dueDate: nextDueDateString,
      recurrence: completedTask.recurrence,
    });
  }
}