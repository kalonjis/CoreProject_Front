import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactDetail } from '../../models/contact.model';
import { ContactStatusBadgeComponent }  from '../contact-status-badge/contact-status-badge.component';
import { CrmAssignPopoverComponent }    from '../../../../shared/components/assign-popover/crm-assign-popover.component';
import { CrmContactApiService }         from '../../services/crm-contact-api.service';
import { CrmUserApiService }            from '../../../../shared/services/crm-user-api.service';
import { FeedbackService }              from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade }                   from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary }            from '../../../../shared/models/commercial.model';

@Component({
  selector: 'app-contact-info-card',
  imports: [DatePipe, RouterLink, ContactStatusBadgeComponent, CrmAssignPopoverComponent],
  templateUrl: './contact-info-card.component.html',
  styleUrl: './contact-info-card.component.scss'
})
/** Info card for a contact with interactive assignee field. */
export class ContactInfoCardComponent implements OnInit {
  @Input({ required: true }) contact!: ContactDetail;
  @Input({ required: true }) publicId!: string;
  @Output() assigned = new EventEmitter<void>();

  private readonly api        = inject(CrmContactApiService);
  private readonly userApi    = inject(CrmUserApiService);
  private readonly feedback   = inject(FeedbackService);
  private readonly authFacade = inject(AuthFacade);

  readonly commercials = signal<CommercialSummary[]>([]);
  readonly loading     = signal(false);

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

  onAssigneeSelected(c: CommercialSummary): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.api.assign(this.publicId, { commercialPublicId: c.publicId }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Contact assigné avec succès.');
        this.assigned.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError("Impossible d'assigner le contact.");
      }
    });
  }
}
