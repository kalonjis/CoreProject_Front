// src/app/features/account/pages/delete-account-page/components/data-warning-dialog/data-warning-dialog.component.ts

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Data Export Warning Dialog.
 *
 * Displayed before the GDPR deletion confirmation step.
 * Informs the user they can download their personal data before permanent deletion,
 * and offers two exit paths:
 * - `exportData`   : user wants to download their data first — parent navigates to export page
 * - `proceedDelete`: user acknowledges and wants to continue with deletion flow
 *
 * @example
 * ```html
 * <app-data-warning-dialog
 *   (exportData)="onExportData()"
 *   (proceedDelete)="onProceedDelete()"
 * />
 * ```
 */
@Component({
  selector: 'app-data-warning-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-warning-dialog.component.html',
  styleUrl: './data-warning-dialog.component.scss'
})
export class DataWarningDialogComponent {

  /** Emitted when the user chooses to export their data first. */
  @Output() exportData = new EventEmitter<void>();

  /** Emitted when the user acknowledges the warning and proceeds with deletion. */
  @Output() proceedDelete = new EventEmitter<void>();

  onExportData(): void {
    this.exportData.emit();
  }

  onProceedDelete(): void {
    this.proceedDelete.emit();
  }
}
