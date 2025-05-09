// confirm-dialog.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmDialogComponent {
  @Input() message: string = '';
  @Input() title: string = '';
  @Input() confirmButtonText: string = 'Confirmer';
  @Input() cancelButtonText: string = 'Annuler';
  @Input() type: 'warning' | 'danger' | 'info' = 'warning';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // État interne
  visible = true;

  onConfirm() {
    this.confirm.emit();
    this.visible = false;
  }

  onCancel() {
    this.cancel.emit();
    this.visible = false;
  }

  // Helper pour les classes CSS
  get dialogClass(): string {
    return `confirm-dialog-${this.type}`;
  }

  // Helper pour l'icône
  get icon(): string {
    switch(this.type) {
      case 'danger': return '⚠️';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '⚠️';
    }
  }
}
