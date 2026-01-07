import { ChangeDetectionStrategy, Component, input, output, OnInit, inject, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, Recurrence } from '../../models/task.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './task-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  show = input.required<boolean>();
  task = input<Task | null>();

  save = output<{ title: string; description: string; dueDate: string; recurrence: Recurrence; }>();
  close = output<void>();

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: ['', Validators.required],
    recurrence: ['none' as Recurrence, Validators.required],
  });

  constructor() {
    effect(() => {
        const taskToEdit = this.task();
        if (taskToEdit) {
            this.taskForm.patchValue({
                title: taskToEdit.title,
                description: taskToEdit.description,
                dueDate: taskToEdit.dueDate,
                recurrence: taskToEdit.recurrence || 'none',
            });
        } else {
            this.taskForm.reset({
              title: '',
              description: '',
              dueDate: '',
              recurrence: 'none'
            });
        }
    });
  }

  ngOnInit() {
    // Set initial form value if a task is provided on init.
    // The effect will handle subsequent changes.
    const initialTask = this.task();
    if (initialTask) {
      this.taskForm.patchValue({
        title: initialTask.title,
        description: initialTask.description,
        dueDate: initialTask.dueDate,
        recurrence: initialTask.recurrence || 'none',
      });
    }
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      return;
    }
    this.save.emit(this.taskForm.value as { title: string; description: string; dueDate: string; recurrence: Recurrence; });
  }

  onClose() {
    this.close.emit();
  }
}
