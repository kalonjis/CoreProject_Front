import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CIVILITY_LABELS, LeadDetail, LEAD_SOURCE_LABELS, LEAD_TYPE_LABELS } from '../../models/lead.model';
import { LeadStatusBadgeComponent } from '../lead-status-badge/lead-status-badge.component';
import { LeadTypeBadgeComponent } from '../lead-type-badge/lead-type-badge.component';

@Component({
  selector: 'app-lead-info-card',
  imports: [DatePipe, LeadStatusBadgeComponent, LeadTypeBadgeComponent],
  templateUrl: './lead-info-card.component.html',
  styleUrl: './lead-info-card.component.scss'
})
export class LeadInfoCardComponent {
  @Input({ required: true }) lead!: LeadDetail;

  readonly civilityLabels   = CIVILITY_LABELS;
  readonly leadSourceLabels = LEAD_SOURCE_LABELS;

  initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }
}
