import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FinancialInputComponent } from '../../components/financial-input/financial-input.component';

@Component({
  selector: 'app-financial-snapshot-page',
  standalone: true,
  imports: [FinancialInputComponent],
  template: `<app-financial-input></app-financial-input>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialSnapshotPageComponent {}
