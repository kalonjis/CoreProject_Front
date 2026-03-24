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
import { CommercialActionStatusBadgeComponent }    from '../commercial-action-status-badge/commercial-action-status-badge.component';
import { CommercialActionFormComponent }           from '../commercial-action-form/commercial-action-form.component';
import { CommercialActionCompleteFormComponent }   from '../commercial-action-complete-form/commercial-action-complete-form.component';
import { ConfirmDialogService }                    from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

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
    CommercialActionStatusBadgeComponent,
    CommercialActionFormComponent,
    CommercialActionCompleteFormComponent
  ],
  templateUrl: './commercial-action-card.component.html',
  styleUrl: './commercial-action-card.component.scss'
})
export class CommercialActionCardComponent {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() completed = new EventEmitter<CompleteEvent>();
  @Output() cancelled = new EventEmitter<string>();
  @Output() edited    = new EventEmitter<void>();

  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly CommercialActionStatus = CommercialActionStatus;
  readonly showEditModal           = signal(false);
  readonly showCompleteModal       = signal(false);

  get isPending(): boolean   { return this.action.status === CommercialActionStatus.PENDING; }
  get dueDateLabel(): string { return requiresCalendarSlot(this.action.type) ? 'RDV' : 'Échéance'; }
  get dueDateFormat(): string { return requiresCalendarSlot(this.action.type) ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'; }

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
