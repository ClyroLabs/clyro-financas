import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './confirmation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationModalComponent {
  show = input.required<boolean>();
  isProcessing = input(false);
  titleKey = input.required<string>();
  messageKey = input.required<string>();
  messageParams = input<Record<string, string | number>>();
  confirmButtonKey = input('confirm');
  cancelButtonKey = input('cancel');
  
  confirm = output<void>();
  cancel = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    if (!this.isProcessing()) {
      this.cancel.emit();
    }
  }
}
