/**
 * Card displaying the full details of a {@link LeadDetail}.
 *
 * Shows contact info, lead type, source, status, and an interactive assignee
 * field backed by {@link CrmAssignPopoverComponent}.
 * Emits {@link assigned} after a successful reassignment.
 */
import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CIVILITY_LABELS, LeadDetail, LEAD_SOURCE_LABELS } from '../../models/lead.model';
import { LeadStatusBadgeComponent }   from '../lead-status-badge/lead-status-badge.component';
import { LeadTypeBadgeComponent }     from '../lead-type-badge/lead-type-badge.component';
import { CrmAssignPopoverComponent }  from '../../../../shared/components/assign-popover/crm-assign-popover.component';
import { CrmLeadApiService }          from '../../services/crm-lead-api.service';
import { CrmUserApiService }          from '../../../../shared/services/crm-user-api.service';
import { FeedbackService }            from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade }                 from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary }          from '../../../../shared/models/commercial.model';

@Component({
  selector: 'app-lead-info-card',
  imports: [DatePipe, LeadStatusBadgeComponent, LeadTypeBadgeComponent, CrmAssignPopoverComponent],
  templateUrl: './lead-info-card.component.html',
  styleUrl: './lead-info-card.component.scss'
})
export class LeadInfoCardComponent implements OnInit {
  /** Full lead details to display. */
  @Input({ required: true }) lead!: LeadDetail;
  /** Public ID of the lead, used for assignment API calls. */
  @Input({ required: true }) publicId!: string;
  /** Emitted after a successful reassignment. */
  @Output() assigned = new EventEmitter<void>();

  private readonly api        = inject(CrmLeadApiService);
  private readonly userApi    = inject(CrmUserApiService);
  private readonly feedback   = inject(FeedbackService);
  private readonly authFacade = inject(AuthFacade);

  /** Label lookup tables for template display. */
  readonly civilityLabels   = CIVILITY_LABELS;
  readonly leadSourceLabels = LEAD_SOURCE_LABELS;
  /** Available commercials for the assignee picker. */
  readonly commercials      = signal<CommercialSummary[]>([]);
  /** True while an assignment request is in flight. */
  readonly loading          = signal(false);

  ngOnInit(): void {
    if (this.authFacade.isAdmin()) {
      this.userApi.getCommercials().subscribe({
        next: list => this.commercials.set(list),
        error: ()  => this.feedback.showError('Impossible de charger les commerciaux.')
      });
    } else {
      const me = this.authFacade.user();
      if (me) {
        this.commercials.set([{ publicId: me.publicId, firstName: me.firstname, lastName: me.lastname, username: me.username }]);
      }
    }
  }

  /** Assigns the lead to the selected commercial and emits {@link assigned} on success. */
  onAssigneeSelected(c: CommercialSummary): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.api.assign(this.publicId, { commercialPublicId: c.publicId }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead assigné avec succès.');
        this.assigned.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError("Impossible d'assigner le lead.");
      }
    });
  }
}
