export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string for date
  completed: boolean;
  recurrence: Recurrence;
  reminderSent?: boolean;
}