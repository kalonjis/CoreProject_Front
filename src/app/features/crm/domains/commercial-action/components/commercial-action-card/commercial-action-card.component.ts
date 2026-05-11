import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  CommercialActionResponse,
  CommercialActionStatus,
  CommercialActionType,
  CompleteCommercialActionRequest,
  requiresCalendarSlot
} from '../../models/commercial-action.model';
import { CommercialActionPriorityBadgeComponent }  from '../commercial-action-priority-badge/commercial-action-priority-badge.component';
import { CommercialActionFormComponent }           from '../commercial-action-form/commercial-action-form.component';
import { CommercialActionCompleteFormComponent }   from '../commercial-action-complete-form/commercial-action-complete-form.component';
import { ConfirmDialogService }                    from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

/** Event payload emitted when a commercial action is confirmed as completed. */
export interface CompleteEvent {
  publicId: string;
  details?: CompleteCommercialActionRequest;
}

@Component({
  selector: 'app-commercial-action-card',
  imports: [
    DatePipe,
    RouterLink,
    CommercialActionPriorityBadgeComponent,
    CommercialActionFormComponent,
    CommercialActionCompleteFormComponent
  ],
  templateUrl: './commercial-action-card.component.html',
  styleUrl: './commercial-action-card.component.scss'
})
/** Reusable card that displays a single commercial action with complete and cancel actions. */
export class CommercialActionCardComponent {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() completed = new EventEmitter<CompleteEvent>();
  @Output() cancelled = new EventEmitter<string>();
  @Output() edited    = new EventEmitter<void>();

  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly CommercialActionStatus = CommercialActionStatus;
  readonly showEditModal     = signal(false);
  readonly showCompleteModal = signal(false);
  readonly showMenu          = signal(false);

  private static readonly TYPE_ICONS: Record<CommercialActionType, string> = {
    [CommercialActionType.TASK]:    '✅',
    [CommercialActionType.CALL]:    '📞',
    [CommercialActionType.EMAIL]:   '📧',
    [CommercialActionType.MEETING]: '📅',
    [CommercialActionType.DEMO]:    '🎯',
  };

  private static readonly TYPE_COLORS: Record<CommercialActionType, string> = {
    [CommercialActionType.TASK]:    '#475569',
    [CommercialActionType.CALL]:    '#2563eb',
    [CommercialActionType.EMAIL]:   '#d97706',
    [CommercialActionType.MEETING]: '#16a34a',
    [CommercialActionType.DEMO]:    '#7c3aed',
  };

  get isPending(): boolean   { return this.action.status === CommercialActionStatus.PENDING; }
  get dueDateLabel(): string { return requiresCalendarSlot(this.action.type) ? 'RDV' : 'Échéance'; }
  get dueDateFormat(): string { return requiresCalendarSlot(this.action.type) ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'; }

  get typeIcon(): string  { return CommercialActionCardComponent.TYPE_ICONS[this.action.type]  ?? '📌'; }
  get typeColor(): string { return CommercialActionCardComponent.TYPE_COLORS[this.action.type] ?? '#475569'; }

  get isToday(): boolean {
    if (!this.action.dueDate) return false;
    return this.action.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10);
  }

  get truncatedDescription(): string {
    const d = this.action.description;
    if (!d) return '';
    return d.length > 80 ? d.slice(0, 80) + '…' : d;
  }

  onComplete(): void {
    this.showCompleteModal.set(true);
  }

  onConfirmed(details: CompleteCommercialActionRequest | undefined): void {
    this.showCompleteModal.set(false);
    this.completed.emit({ publicId: this.action.publicId, details });
  }

  onCancel(): void {
    this.confirmDialog.confirm({
      title: 'Annuler l\'action',
      message: 'Cette action sera marquée comme annulée. Continuer ?',
      confirmButtonText: 'Annuler l\'action',
      type: 'warning'
    }).then(() => this.cancelled.emit(this.action.publicId)).catch(() => {});
  }

  onUpdated(): void {
    this.showEditModal.set(false);
    this.edited.emit();
  }
}
